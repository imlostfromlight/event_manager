from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TicketType, Ticket
from .serializers import TicketTypeSerializer, TicketSerializer, PurchaseTicketSerializer
from apps.users.permissions import IsOrganizer, IsOwnerOrAdmin


class TicketTypeViewSet(viewsets.ModelViewSet):
    serializer_class = TicketTypeSerializer

    def get_queryset(self):
        return TicketType.objects.filter(event__organizer=self.request.user)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticatedOrReadOnly()]
        return [IsOrganizer()]

    def get_queryset(self):
        qs = TicketType.objects.select_related('event')
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs


class MyTicketsView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user).select_related(
            'ticket_type__event'
        ).order_by('-purchased_at')


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user)
