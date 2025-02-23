export function get (req, res) {
  return res.render('index.njk', { user: req.user })
}

