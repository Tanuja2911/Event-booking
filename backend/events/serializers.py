from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields = '__all__'

    def validate(self, data):
        venue = data.get('venue')
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time >= end_time:
            raise serializers.ValidationError(
                "End time must be after start time."
            )

        overlapping_events = Event.objects.filter(
            venue=venue,
            date=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if overlapping_events.exists():
            raise serializers.ValidationError(
                "This venue already has an overlapping event at this time."
            )

        return data