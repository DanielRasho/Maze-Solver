import csv
from neo4j import GraphDatabase
import os
import dotenv

dotenv.load_dotenv()
uri = os.environ.get('NEO4J_URI')
username = os.environ.get('NEO4J_USERNAME')
password = os.environ.get('NEO4J_PASSWORD')

def relation(name):
    driver = GraphDatabase.driver(uri, auth=(username, password))

    query = """
    MATCH (a:Piece{id: '$node'}), (b:Piece{id: '$to'})
    MERGE (a)-[:CONNECTED{where: '$direction'}]->(b) 
    """

    try:        
        with open(name, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                print(row)
                records, summary, keys = driver.execute_query(
                    query,
                    node=row[0],
                    to=row[2],
                    direction=row[1]
                )

        driver.close()
        return records.count
    except:
        driver.close()
        return 'Error'


if __name__ == '__main__':
    print(username, uri, password)
    relation('relations.csv')