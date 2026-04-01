import postgres from "postgres";

async function testConnection() {
  console.log("Testing Pooler (6543) with prefixed username...");
  const sql1 = postgres("postgresql://postgres.flpxaxovqcpxzyotnvwe:Dracco237?@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true", { ssl: "require", timeout: 5 });
  try {
    const res = await sql1`SELECT 1 as connected`;
    console.log("Pooler (6543) Success:", res);
  } catch (err) {
    console.error("Pooler (6543) Failed:", err.message);
  } finally {
    await sql1.end();
  }

  console.log("\nTesting Direct Host (5432) with IPv6 address...");
  const sql2 = postgres({
    host: "2600:1f18:2e13:9d4e:f5b6:cb11:6c5:ebc5",
    port: 5432,
    user: "postgres",
    password: "Dracco237?",
    database: "postgres",
    ssl: "require",
    timeout: 5
  });
  try {
    const res = await sql2`SELECT 1 as connected`;
    console.log("Direct IPv6 Success:", res);
  } catch (err) {
    console.error("Direct IPv6 Failed:", err.message);
  } finally {
    await sql2.end();
  }

  console.log("\nTesting Direct Host (5432) with brackets...");
  const sql3 = postgres({
    host: "[2600:1f18:2e13:9d4e:f5b6:cb11:6c5:ebc5]",
    port: 5432,
    user: "postgres",
    password: "Dracco237?",
    database: "postgres",
    ssl: "require",
    timeout: 5
  });
  try {
    const res = await sql3`SELECT 1 as connected`;
    console.log("Direct Bracketed IPv6 Success:", res);
  } catch (err) {
    console.error("Direct Bracketed IPv6 Failed:", err.message);
  } finally {
    await sql3.end();
  }
}

testConnection();
