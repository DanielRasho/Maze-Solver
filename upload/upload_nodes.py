import csv
from pathlib import Path
import sys

root_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(root_dir))

from db.conn import db  # Conexión Neo4j


def upload_puzzle_pieces(puzzle_theme: str, puzzle_material: str, custom_id: str) -> str:
    data_file = Path(__file__).parent / "data" / "nodes.csv"

    if not data_file.exists():
        print(f"Archivo CSV no encontrado: {data_file}")
        return

    driver = db.get_driver()

    with driver.session() as session, open(data_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        # 1. Crear nodo Puzzle con custom_id único
        session.run("""
            MERGE (p:Puzzle {custom_id: $custom_id})
            SET p.theme = $theme,
                p.material = $material
        """, {
            "theme": puzzle_theme,
            "material": puzzle_material,
            "custom_id": custom_id	
        })

        print(f"✅ Puzzle creado o actualizado con custom_id: {custom_id}")

        # 2. Crear nodos Piece y relacionarlos con el Puzzle
        for row in reader:
            is_missing = row['isMissing'].strip().upper() == "TRUE"
            ports_raw = row.get('ports', '').strip()
            ports = [int(p.strip()) for p in ports_raw.split(',')] if ports_raw else []

            session.run("""
                MATCH (p:Puzzle {custom_id: $custom_id})
                CREATE (piece:Piece {
                    id: $id,
                    type: $type,
                    isMissing: $isMissing,
                    ports: $ports
                })-[:BELONGS]->(p)
            """, {
                "id": int(row['id']),
                "type": row['type'],
                "isMissing": is_missing,
                "ports": ports,
                "custom_id": custom_id
            })

        print("✅ Piezas y relaciones 'BELONGS' creadas.")
    return custom_id


if __name__ == "__main__":
    # Puedes probar con valores reales
    upload_puzzle_pieces("Real Marine Life", "Wood", "realOctopus")
