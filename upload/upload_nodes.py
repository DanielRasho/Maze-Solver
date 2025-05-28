import csv
from pathlib import Path
import sys

# Agregar raíz del proyecto al sys.path para importar desde /db
root_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(root_dir))

from db.conn import db  # Importa la conexión Neo4j

def upload_puzzle_pieces():
    data_file = Path(__file__).parent / "data" / "nodes.csv"
    
    if not data_file.exists():
        print(f"Archivo CSV no encontrado: {data_file}")
        return

    driver = db.get_driver()

    with driver.session() as session, open(data_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Convertir booleano desde string
            is_missing = row['isMissing'].strip().upper() == "TRUE"

            session.run("""
                CREATE (:Piece {
                    id: $id,
                    type: $type,
                    isMissing: $isMissing
                })
            """, {
                "id": int(row['id']),
                "type": row['type'],
                "isMissing": is_missing
            })

        print("Piezas del rompecabezas subidas exitosamente.")

if __name__ == "__main__":
    upload_puzzle_pieces()
