from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketTypeViewSet, MyTicketsView, TicketDetailView

router = DefaultRouter()
router.register('types', TicketTypeViewSet, basename='ticket-types')

urlpatterns = [
    path('my/', MyTicketsView.as_view(), name='my-tickets'),
    path('my/<int:pk>/', TicketDetailView.as_view(), name='ticket-detail'),
    path('', include(router.urls)),
]
