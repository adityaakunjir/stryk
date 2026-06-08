async function test() {
  const res = await fetch("http://localhost:3000/api/check-username?username=ajinkyashete", {
    headers: {
      // Need a mock or we will get 401 Unauthorized, but let's see if we get 401 instead of 500
    }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
test();
