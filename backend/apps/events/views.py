import io
import openpyxl
from reportlab.pdfgen import canvas as pdf_canvas
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Event, EventRegistration, Comment, Review, Report, FavoriteEvent
from .serializers import (
    CategorySerializer, EventListSerializer, EventDetailSerializer,
    CommentSerializer, ReviewSerializer, ReportSerializer, RegistrationSerializer
)
from .filters import EventFilter
from apps.users.permissions import IsOrganizer, IsOwnerOrAdmin
from apps.notifications.tasks import send_registration_email


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class EventViewSet(viewsets.ModelViewSet):
    filterset_class = EventFilter
    search_fields = ['title', 'description', 'place']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['-start_time']

    def get_queryset(self):
        user = self.request.user
        qs = Event.objects.select_related('category', 'organizer').prefetch_related(
            'registrations', 'favorited_by'
        )
        # Private events visible only to organizer or via private_token
        if not user.is_authenticated or user.role == 'participant':
            qs = qs.filter(
                Q(visibility=Event.VISIBILITY_PUBLIC) | Q(organizer=user)
            ).filter(status=Event.STATUS_PUBLISHED)
        elif user.role == 'organizer':
            qs = qs.filter(
                Q(visibility=Event.VISIBILITY_PUBLIC, status=Event.STATUS_PUBLISHED) |
                Q(organizer=user)
            )
        return qs

    def get_serializer_class(self):
        if self.action in ['list', 'recommended']:
            return EventListSerializer
        return EventDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action in ['create']:
            return [IsOrganizer()]
        if self.action in ['update', 'partial_update', 'destroy', 'export_excel', 'export_pdf', 'participants']:
            return [IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    # ---- Private event access via token ----
    @action(detail=False, methods=['get'], url_path='private/(?P<token>[^/.]+)',
            permission_classes=[permissions.AllowAny])
    def by_private_token(self, request, token=None):
        try:
            event = Event.objects.get(private_token=token, visibility=Event.VISIBILITY_PRIVATE)
        except Event.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(EventDetailSerializer(event, context={'request': request}).data)

    # ---- Register / Unregister ----
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        event = self.get_object()
        if event.event_format == Event.FORMAT_PAID:
            return Response(
                {'detail': 'Для платных мероприятий необходима оплата.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if event.participant_limit and event.registrations_count >= event.participant_limit:
            return Response({'detail': 'Места закончились.'}, status=status.HTTP_400_BAD_REQUEST)

        reg, created = EventRegistration.objects.get_or_create(
            user=request.user, event=event,
            defaults={'status': EventRegistration.STATUS_REGISTERED}
        )
        if not created:
            if reg.status == EventRegistration.STATUS_CANCELLED:
                reg.status = EventRegistration.STATUS_REGISTERED
                reg.save()
            else:
                return Response({'detail': 'Уже зарегистрирован.'}, status=status.HTTP_400_BAD_REQUEST)

        send_registration_email.delay(request.user.id, event.id)
        return Response({'detail': 'Успешно зарегистрирован.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unregister(self, request, pk=None):
        event = self.get_object()
        try:
            reg = EventRegistration.objects.get(user=request.user, event=event)
            reg.status = EventRegistration.STATUS_CANCELLED
            reg.save()
            return Response({'detail': 'Регистрация отменена.'})
        except EventRegistration.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    # ---- Favorite ----
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        event = self.get_object()
        _, created = FavoriteEvent.objects.get_or_create(user=request.user, event=event)
        return Response({'saved': True}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def unfavorite(self, request, pk=None):
        event = self.get_object()
        FavoriteEvent.objects.filter(user=request.user, event=event).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---- Comments ----
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        event = self.get_object()
        if request.method == 'GET':
            comments = event.comments.select_related('user').order_by('-created_at')
            return Response(CommentSerializer(comments, many=True, context={'request': request}).data)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ---- Reviews ----
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        event = self.get_object()
        if request.method == 'GET':
            return Response(ReviewSerializer(event.reviews.select_related('user'), many=True).data)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ---- Report ----
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def report(self, request, pk=None):
        event = self.get_object()
        serializer = ReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ---- Participants list (organizer) ----
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        event = self.get_object()
        regs = event.registrations.select_related('user').filter(status='registered')
        return Response(RegistrationSerializer(regs, many=True).data)

    # ---- Export Excel ----
    @action(detail=True, methods=['get'], url_path='export/excel')
    def export_excel(self, request, pk=None):
        event = self.get_object()
        regs = event.registrations.select_related('user').filter(status='registered')

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Участники'
        ws.append(['#', 'Email', 'Имя', 'Дата регистрации'])
        for i, reg in enumerate(regs, 1):
            ws.append([i, reg.user.email, reg.user.full_name, str(reg.registered_at)])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        response = HttpResponse(buf, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="participants_{event.id}.xlsx"'
        return response

    # ---- Export PDF ----
    @action(detail=True, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request, pk=None):
        event = self.get_object()
        regs = event.registrations.select_related('user').filter(status='registered')

        buf = io.BytesIO()
        p = pdf_canvas.Canvas(buf)
        p.setFont('Helvetica-Bold', 16)
        p.drawString(50, 800, f'Участники: {event.title}')
        p.setFont('Helvetica', 12)
        y = 770
        for i, reg in enumerate(regs, 1):
            p.drawString(50, y, f'{i}. {reg.user.full_name} ({reg.user.email})')
            y -= 20
            if y < 50:
                p.showPage()
                y = 800
        p.save()
        buf.seek(0)
        response = HttpResponse(buf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="participants_{event.id}.pdf"'
        return response

    # ---- Recommendations ----
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def recommended(self, request):
        user = request.user
        prefs = user.preferences.all()
        registered_ids = EventRegistration.objects.filter(user=user).values_list('event_id', flat=True)
        qs = Event.objects.filter(
            category__in=prefs,
            status=Event.STATUS_PUBLISHED,
            visibility=Event.VISIBILITY_PUBLIC,
        ).exclude(id__in=registered_ids).order_by('start_time')[:20]
        return Response(EventListSerializer(qs, many=True, context={'request': request}).data)

    # ---- My Favorites ----
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def favorites(self, request):
        ids = FavoriteEvent.objects.filter(user=request.user).values_list('event_id', flat=True)
        qs = Event.objects.filter(id__in=ids)
        return Response(EventListSerializer(qs, many=True, context={'request': request}).data)

    # ---- My Registrations ----
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_registrations(self, request):
        regs = EventRegistration.objects.filter(
            user=request.user, status=EventRegistration.STATUS_REGISTERED
        ).select_related('event__category', 'event__organizer')
        events = [r.event for r in regs]
        return Response(EventListSerializer(events, many=True, context={'request': request}).data)

    # ---- Organizer analytics ----
    @action(detail=True, methods=['get'], url_path='analytics', permission_classes=[IsOwnerOrAdmin])
    def analytics(self, request, pk=None):
        from django.db.models.functions import TruncDay
        from django.db.models import Count
        event = self.get_object()
        daily = (
            EventRegistration.objects
            .filter(event=event, status='registered')
            .annotate(day=TruncDay('registered_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        return Response({
            'total': event.registrations_count,
            'limit': event.participant_limit,
            'daily': list(daily),
        })


class MyEventsView(generics.ListAPIView):
    serializer_class = EventListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(organizer=self.request.user)
