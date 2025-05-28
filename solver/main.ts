import neo4j, { Driver, Session } from "npm:neo4j-driver";

const uri = Deno.env.get("NEO4J_URI");
const username = Deno.env.get("NEO4J_USER");
const password = Deno.env.get("NEO4J_PASSWORD");

const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function executeQuery(query: string, params: object) {
	const session: Session = driver.session();
	try {
		const result = await session.executeRead((tx) => tx.run(query, params));
		return result.records;
	} finally {
		await session.close();
	}
}

type Connection = {
	FromPort: string;
	ToPort: string;
	ConnectedPiece: PuzzlePiece;
};

type PuzzlePiece = {
	Id: string;
	IsMissing: boolean;
	Connections: Connection[];
};

type PuzzleInfo = {
	Tematica: string;
	Material: string;
};

async function main() {
	// const puzzleId = prompt("What puzzle do you whish to solve?");
	const puzzleId = "realOctopus";
	const pieceId = parseInt(prompt("What piece is your starting point?"));

	const query = `
MATCH (cs:Piece {id: $pieceId}) -[:BELONGS]-> (:Puzzle {custom_id: $puzzleId})
CALL apoc.path.expandConfig(cs,{relationshipFilter:'CONNECTED>',uniqueness:'NODE_GLOBAL'}) YIELD path
RETURN path`;
	const params = { pieceId, puzzleId };
	const records: any[] = await executeQuery(query, params);
	records.forEach((r) => {
		console.log(r.get("path"));
	});
	// console.log(records);

	// const root = constructTree(records, startingPieceId);
}

main()
	.catch(console.error)
	.finally(() => driver.close());
