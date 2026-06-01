from django.urls import path
from .views import InitiatePaymentView, ConfirmPaymentView, MyPaymentsView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('confirm/<int:payment_id>/', ConfirmPaymentView.as_view(), name='payment-confirm'),
    path('my/', MyPaymentsView.as_view(), name='my-payments'),
]
