export function get (req, res) {
  return res.render('index.njk', { logged_in: req.user !== undefined })
}

