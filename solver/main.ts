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
	const puzzleId = "realOctopus";
	const pieceId = parseInt(prompt("What piece is your starting point?"));

	// TODO: Check if pieceId is not a missing piece...

	const query = `
MATCH (cs:Piece {id: $pieceId}) -[:BELONGS]-> (:Puzzle {custom_id: $puzzleId})
CALL apoc.path.expandConfig(cs,{relationshipFilter:'CONNECTED>',uniqueness:'NODE_GLOBAL'}) YIELD path
RETURN path`;
	const params = { pieceId, puzzleId };
	const records: any[] = await executeQuery(query, params);

	let missingPieces = new Set<string>();
	for (let i = 1; i < records.length; i++) {
		const record = records[i];
		const segments = record.get("path").segments;
		const lastPathSegment = segments[segments.length - 1];

		if (lastPathSegment.start.properties.isMissing) {
			missingPieces.add(lastPathSegment.start.properties.id.low);
			continue;
		}
		if (lastPathSegment.end.properties.isMissing) {
			missingPieces.add(lastPathSegment.end.properties.id.low);
			continue;
		}

		// TODO: Prettify this logging...
		console.log(
			"Connecte el puerto",
			lastPathSegment.relationship.properties.fromPort.low,
			"de la pieza",
			lastPathSegment.start.properties.id.low,
			"al puerto",
			lastPathSegment.relationship.properties.toPort.low,
			"de la pieza",
			lastPathSegment.end.properties.id.low,
		);
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
