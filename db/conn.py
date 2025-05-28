import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

class Neo4jConnection:
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self._driver.close()

    def get_driver(self):
        return self._driver

# Obtener credenciales desde variables de entorno
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# Crear conexión reutilizable
db = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
