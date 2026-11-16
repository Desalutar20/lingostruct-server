import uuid
from abc import ABC, abstractmethod
from datetime import datetime


class Entity[TId: uuid.UUID](ABC):
    @abstractmethod
    def __init__(
        self,
        id: TId,
        created_at: datetime,
        updated_at: datetime,
    ):
        self.__id = id
        self.__created_at = created_at
        self.__updated_at = updated_at

    @property
    def id(self) -> TId:
        return self.__id

    @property
    def created_at(self):
        return self.__created_at

    @property
    def updated_at(self):
        return self.__updated_at

    @updated_at.setter
    def _updated_at(self, date: datetime):
        self.__updated_at = date
