from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, EventViewSet, MyEventsView

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='categories')
router.register('', EventViewSet, basename='events')

urlpatterns = [
    path('my/', MyEventsView.as_view(), name='my-events'),
    path('', include(router.urls)),
]
