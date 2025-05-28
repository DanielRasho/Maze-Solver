import neo4j, { Driver, Session } from "npm:neo4j-driver";

const uri = "bolt://localhost:7687";
const username = "neo4j";
const password = "6OV31H6Q5NdSCqGatBtpV27Mcd-gKctC99ZzFEAE1H0";

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
	const query = "MATCH (n:Person {name: $name}) RETURN n";
	const params = { name: "Alice" };
	const records = await executeQuery(query, params);
	console.log(records);
}

main()
	.catch(console.error)
	.finally(() => driver.close());
