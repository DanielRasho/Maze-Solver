import csv
from neo4j import GraphDatabase
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()
uri = os.environ.get('NEO4J_URI')
username = os.environ.get('NEO4J_USER')
password = os.environ.get('NEO4J_PASSWORD')

def create_relations(csv_filename, puzzle_id):
    driver = GraphDatabase.driver(uri, auth=(username, password))

    try:
        total = 0
        with open(csv_filename, 'r', newline='') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Read from named fields in the header
                from_id = int(row['from'].strip())
                to_id = int(row['to'].strip())
                from_port = int(row['fromPort'].strip())
                to_port = int(row['toPort'].strip())

                print(f"Creating connection: {from_id} ({from_port}) → {to_id} ({to_port})")
                
                query = f"""
                MATCH 
                    (:Puzzle {{custom_id: '{puzzle_id}'}}) <-[:BELONGS]- (a:Piece {{id: {from_id}}}),
                    (b:Piece {{id: {to_id}}}) -[:BELONGS]-> (:Puzzle {{custom_id: '{puzzle_id}'}})
                MERGE 
                    (a)-[:CONNECTED {{
                        fromPort: {from_port},
                        toPort: {to_port}
                    }}]->(b)
                """

                inverse_query = f"""
                MATCH
                    (:Puzzle {{custom_id: '{puzzle_id}'}}) <-[:BELONGS]- (a:Piece {{id: {to_id}}}),
                    (b:Piece {{id: {from_id}}}) -[:BELONGS]-> (:Puzzle {{custom_id: '{puzzle_id}'}})
                MERGE (a)-[:CONNECTED {{
                    fromPort: {to_port},
                    toPort: {from_port}
                }}]->(b)
                """

                with driver.session() as session:
                    session.run(query)
                    session.run(inverse_query)

                total += 1

        return f"Successfully processed {total} rows"
    except Exception as e:
        return f"Error: {e}"
    finally:
        driver.close()

def fetch_all_connections():
    driver = GraphDatabase.driver(uri, auth=(username, password))

    query = """
    MATCH (a:Piece)-[r:CONNECTED]->(b:Piece)
    RETURN 
        a.id AS from,
        b.id AS to,
        r.fromPort AS fromPort,
        r.toPort AS toPort
    ORDER BY from, to
    """

    try:
        results = []
        with driver.session() as session:
            result = session.run(query)
            for record in result:
                results.append({
                    "from": record["from"],
                    "to": record["to"],
                    "fromPort": record["fromPort"],
                    "toPort": record["toPort"],
                })

        return results
    except Exception as e:
        print("Error:", e)
        return []
    finally:
        driver.close()


if __name__ == '__main__':
    print("Connecting to Neo4j with", username, uri)
    result = create_relations('relations.csv', 1)
    print(result)
    print("LIST OF RELATIONS")
    print(fetch_all_connections())