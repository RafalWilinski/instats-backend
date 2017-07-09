const postgres = require('../../postgres');

const registerPurchase = (req, res) => {
  if (req.query.cancel == 'true') {
    postgres('users')
      .where({
        id: req.params.userId,
      })
      .returning('*')
      .update('is_premium', false)
      .then(() => {
        return res.send({ isPremium: false });
      })
      .catch((error) => {
        res.status(500);
        return res.send(error);
      });
  }

  if (req.body.purchase) {
    postgres('payments')
      .insert({
        user_id: req.params.userId,
        transaction_id: req.body.purchase.transationIdentifier,
        date: req.body.purchase.transactionDate,
        product_id: req.body.purchase.productIdentifier,
        receipt: req.body.transactionReceipt,
      })
      .then(() => {
        postgres('users')
          .where({
            id: req.params.userId,
          })
          .update({
            is_premium: true,
          })
          .then(() => {
            return res.send({ isPremium: true });
          })
          .catch((error) => {
            res.status(500);
            return res.send(error);
          });
      })
      .catch((error) => {
        res.status(500);
        return res.send(error);
      });
  }
};

module.exports = registerPurchase;
