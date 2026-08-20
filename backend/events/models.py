from django.db import models
from venues.models import Venue
from users.models import User


class Event(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField()

    start_time = models.TimeField()
    end_time = models.TimeField()

    venue = models.ForeignKey(
        Venue,
        on_delete=models.CASCADE
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )