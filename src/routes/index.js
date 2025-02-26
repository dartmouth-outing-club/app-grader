export function get(req, res) {
  const { user, is_admin } = req
  return res.render('index.njk', { user, is_admin })
}
