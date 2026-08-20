from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['user', 'status', 'booked_at']

    def validate(self, data):
        user = self.context['request'].user
        event = data.get('event')

        already_booked = Booking.objects.filter(
            user=user,
            event=event,
            status__in=['pending', 'confirmed']
        ).exists()

        if already_booked:
            raise serializers.ValidationError(
                "You already have an active booking for this event."
            )

        return data