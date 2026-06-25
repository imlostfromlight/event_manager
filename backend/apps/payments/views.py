import uuid
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import Payment
from .serializers import PaymentSerializer, InitiatePaymentSerializer
from apps.tickets.models import TicketType, Ticket
from apps.events.models import EventRegistration
from apps.notifications.tasks import send_registration_email


class InitiatePaymentView(APIView):
    """
    Mock payment flow:
    1. Client sends ticket_type_id + method
    2. We create a Ticket + Payment(pending) and return a mock checkout URL
    3. Client calls /confirm/ with the payment id
    4. We mark payment completed, generate QR, register user for event
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            ticket_type = TicketType.objects.get(id=data['ticket_type_id'])
        except TicketType.DoesNotExist:
            return Response({'detail': 'Тип билета не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket_type.available <= 0:
            return Response({'detail': 'Билеты закончились.'}, status=status.HTTP_400_BAD_REQUEST)

        if ticket_type.event.event_format != 'paid':
            return Response({'detail': 'Это мероприятие бесплатное.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create ticket (inactive until payment confirmed)
        ticket = Ticket.objects.create(
            ticket_type=ticket_type,
            user=request.user,
            status=Ticket.STATUS_CANCELLED,  # Will activate on payment confirm
        )

        # Generate mock Stripe payment intent ID
        mock_intent_id = f'pi_{"".join([format(b, "02x") for b in uuid.uuid4().bytes])[:24]}'

        payment = Payment.objects.create(
            user=request.user,
            ticket=ticket,
            amount=ticket_type.price,
            method=data['method'],
            status=Payment.STATUS_PENDING,
            stripe_payment_intent_id=mock_intent_id,
        )

        return Response({
            'payment_id': payment.id,
            'amount': str(payment.amount),
            'method': payment.method,
            'client_secret': f'{mock_intent_id}_secret_mock',
        }, status=status.HTTP_201_CREATED)


class ConfirmPaymentView(APIView):
    """Mock payment confirmation — always succeeds."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):
        try:
            payment = Payment.objects.get(
                id=payment_id, user=request.user, status=Payment.STATUS_PENDING
            )
        except Payment.DoesNotExist:
            return Response({'detail': 'Платёж не найден.'}, status=status.HTTP_404_NOT_FOUND)

        # Store card last4 if provided
        card_last4 = request.data.get('card_last4', '')

        # Activate ticket
        ticket = payment.ticket
        ticket.status = Ticket.STATUS_ACTIVE
        ticket.generate_qr()
        ticket.save()

        # Mark payment done
        payment.status = Payment.STATUS_COMPLETED
        payment.card_last4 = card_last4
        payment.save()

        # Register user for event
        event = ticket.ticket_type.event
        EventRegistration.objects.get_or_create(
            user=request.user, event=event,
            defaults={'status': EventRegistration.STATUS_REGISTERED}
        )

        # Email is non-critical — never let it fail the payment confirmation
        try:
            send_registration_email.delay(request.user.id, event.id)
        except Exception:
            pass

        return Response({
            'status': 'success',
            'ticket_id': ticket.id,
            'qr_code': request.build_absolute_uri(ticket.qr_code.url) if ticket.qr_code else None,
        })


class MyPaymentsView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
