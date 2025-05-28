import * as neo4j from "neo4j-driver";
import * as path from "path";
import * as dotenv from "dotenv";


dotenv.config({ path: path.resolve(__dirname, "../.env") });

const uri = process.env.NEO4J_URI!;
const username = process.env.NEO4J_USER!;
const password = process.env.NEO4J_PASSWORD!;
const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

//execute query
async function executeQuery(query: string, params: object) {
  const session = driver.session();
  try {
    const result = await session.executeRead((tx) => tx.run(query, params));
    return result.records;
  } finally {
    await session.close();
  }
}

/* shows all available pieces 
async function showAllPieces() {
  const records = await executeQuery(
    `
    MATCH (p:Piece)
    RETURN p.id AS id, p.type AS type, p.isMissing AS isMissing
    ORDER BY id
  `,
    {}
  );

  console.log("Available pieces:");
  for (const record of records) {
    console.log(
      `Piece ${record.get("id")}: tipo=${record.get("type")}, missing=${record.get("isMissing")}`
    );
  }
}
  */

// Tipos de datos
type Connection = {
  Piece: PuzzlePiece;
  PortFrom: number;
  PortTo: number;
};

type PuzzlePiece = {
  Id: string;
  IsMissing: boolean;
  Connections: Connection[];
};

// Obtener conexiones de una pieza
async function getConnections(pieceId: string): Promise<Connection[]> {
	const query = `
	MATCH (p:Piece {id: $id})-[r:CONNECTED]->(adj:Piece)
	RETURN adj.id AS adjId, adj.isMissing AS isMissing, 
		   r.fromPort AS portFrom, r.toPort AS portTo
  `;
  
  const records = await executeQuery(query, { id: pieceId });

  return records.map((record) => ({
    Piece: {
      Id: record.get("adjId")?.toString(),
      IsMissing: record.get("isMissing") ?? false,
      Connections: [],
    },
    PortFrom: record.get("portFrom"),
    PortTo: record.get("portTo"),
  }));
}

// Búsqueda BFS desde pieza inicial
async function bfs(startId: string): Promise<Map<string, PuzzlePiece>> {
  const visited = new Set<string>();
  const queue: string[] = [startId];
  const puzzleMap = new Map<string, PuzzlePiece>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const connections = await getConnections(currentId);
    const piece: PuzzlePiece = {
      Id: currentId,
      IsMissing: false,
      Connections: connections,
    };
    puzzleMap.set(currentId, piece);

    for (const conn of connections) {
      if (!visited.has(conn.Piece.Id)) {
        queue.push(conn.Piece.Id);
      }
    }
  }

  return puzzleMap;
}

// Función principal
async function main() {
  const startId = process.argv[2];
  //await showAllPieces();

  if (!startId) {
    console.error("\nPlease enter the starting piece id as argument.");
    console.error("Example: npx ts-node solver/main.ts 1");
    process.exit(1);
  }

  console.log(`\nSolving puzzle from piece: ${startId}`);
  const puzzle = await bfs(startId);

  console.log(`\n: ${startId}`);
  console.log("=".repeat(40));

  for (const [id, piece] of puzzle.entries()) {
    console.log(`Piece ${id} (Missing: ${piece.IsMissing ? "Yes" : "No"})`);
    if (piece.Connections.length === 0) {
      console.log("  (No connections)");
    } else {
      for (const conn of piece.Connections) {
        console.log(
          `  ↳ port ${conn.PortFrom} → piece ${conn.Piece.Id} (port ${conn.PortTo})`
        );
      }
    }
    console.log("-".repeat(40));
  }
}

main()
  .catch(console.error)
  .finally(() => driver.close());
