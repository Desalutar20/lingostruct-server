from typing import NewType
from uuid import UUID

OutboxID = NewType("OutboxID", UUID)
