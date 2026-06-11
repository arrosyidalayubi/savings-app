export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { email, password } = await request.json();

    // Cek kecocokan kredensial di database D1
    const { results } = await env.DB.prepare(
      `SELECT id, email FROM users WHERE email = ? AND password = ?`
    ).bind(email, password).all();

    if (results.length > 0) {
      // Login sukses
      return Response.json({ success: true, user: results[0] });
    } else {
      // Login gagal
      return Response.json({ success: false, error: "Kredensial tidak valid" }, { status: 401 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}