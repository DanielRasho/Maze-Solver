from upload_nodes import upload_puzzle_pieces
from upload_relations import create_relations

puzzle_theme = "dinosaurs"
puzzle_material = "wood"
custom_id = "dino"

"""
Uploads puzzle pieces to the Neo4j database with the specified theme, material, and custom ID.
Created BELONG relationships between the puzzle and its pieces.
return de custom id of the puzzle.
"""
puzzle_id = upload_puzzle_pieces(puzzle_theme, puzzle_material, custom_id)

result = create_relations('relations.csv', puzzle_id)
print(result)

"""
@TODO Upload the relations between the pieces using puzzle_id.
"""

"""
@NOTE use this query to delete the puzzle and its pieces if testing
MATCH (p:Puzzle {theme: puzzle_theme"})
OPTIONAL MATCH (p)<-[r:BELONGS]-(piece:Piece)
DETACH DELETE p, piece
"""