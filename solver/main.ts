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

async function main() {
	// TODO: Uncomment this...
	// const puzzleId = prompt("What puzzle do you whish to solve?");
	//const puzzleId = "realOctopus";
	const puzzleId = prompt("Enter the ID of the puzzle you wish to solve:");

	if (!puzzleId || puzzleId.trim() === "") {
		console.error("Invalid puzzle ID.");
		Deno.exit(1);
	}
	
	const puzzleInfoQuery = `
		MATCH (p:Puzzle {custom_id: $puzzleId})
		RETURN p.theme AS theme, p.material AS material
	`;
	const puzzleInfoResult = await executeQuery(puzzleInfoQuery, { puzzleId });

	if (puzzleInfoResult.length === 0) {
		console.error(` Puzzle '${puzzleId}' not found in the database.`);
		Deno.exit(1);
	}

	const puzzleTheme = puzzleInfoResult[0].get("theme");
	const puzzleMaterial = puzzleInfoResult[0].get("material");

	console.log(`Puzzle Info:
	- Theme: ${puzzleTheme}
	- Material: ${puzzleMaterial}`);


	const pieceId = parseInt(prompt("What piece is your starting point?"));


	const checkPieceQuery = `
		MATCH (p:Piece {id: $pieceId})-[:BELONGS]->(:Puzzle {custom_id: $puzzleId})
		RETURN p.isMissing AS isMissing
	`;
	const checkPieceResult = await executeQuery(checkPieceQuery, { pieceId, puzzleId });

	if (checkPieceResult.length === 0) {
		console.error(`Piece ${pieceId} does not belong to puzzle '${puzzleId}'.`);
		Deno.exit(1);
	}

	const isMissing = checkPieceResult[0].get("isMissing");

	if (isMissing) {
		console.error(`Cannot start from Piece ${pieceId}: it is marked as missing.`);
		Deno.exit(1);
	}


	const query = `
MATCH (cs:Piece {id: $pieceId}) -[:BELONGS]-> (:Puzzle {custom_id: $puzzleId})
CALL apoc.path.expandConfig(cs,{relationshipFilter:'CONNECTED>',uniqueness:'NODE_GLOBAL'}) YIELD path
RETURN path`;
	const params = { pieceId, puzzleId };
	const records: any[] = await executeQuery(query, params);

	let stepNumber = 1; //Step number start
	const missingPieces = new Set<string>();

	console.log("\nPuzzle connections:\n");

	//Print puzzle steps
	for (const record of records) {
		const segments = record.get("path").segments;
	
		for (const segment of segments) {
			const from = segment.start.properties;
			const to = segment.end.properties;
			const rel = segment.relationship.properties;
	
			const fromId = from.id?.low ?? from.id;
			const toId = to.id?.low ?? to.id;
			const fromPort = rel.fromPort?.low ?? rel.fromPort;
			const toPort = rel.toPort?.low ?? rel.toPort;
	
			const fromMissing = from.isMissing === true;
			const toMissing = to.isMissing === true;
	
			if (fromMissing) missingPieces.add(fromId);
			if (toMissing) missingPieces.add(toId);
			if (fromMissing || toMissing) continue;
			
			console.log(
				`- Step ${stepNumber++}: Connect port ${fromPort} of Piece ${fromId} → port ${toPort} of Piece ${toId}`
			);
		}
	}

	if (missingPieces.size > 0) {
		console.log("WARNING: Tienes piezas faltantes!");
	}
	for (const id of missingPieces) {
		console.log("-", id);
	}
}

main()
	.catch(console.error)
	.finally(() => driver.close());
