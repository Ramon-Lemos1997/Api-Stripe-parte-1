require('dotenv').config();
const axios = require('axios'); 
const stripe= require('stripe')(process.env.TOKEN_STRIPE);
const jwt = require('jsonwebtoken');
//const lodash= require('lodash');
//const socket= require('socket.io-client');


const apiController = {
  apiStripe: async function (req, res) {
    const itemId = req.body?.productId; //aqui recedo o array com o items;
    const token = req.headers?.authorization; //para identificação e autorização;
    //console.log(itemId)
    const decodedToken = await jwt.verify(token, process.env.TOKEN_SECRET);
    if (!itemId || !token) { 
      throw new Error('Dados inválidos ou nulos.');
    }
    //crio um array somente com todos os objetos do itemId;
    const compressItems = [].concat(...itemId);
    // aqui crio um array que irei utilziar para somar o preço total a cobrar;
    const totalPrice = compressItems.map(item => ({
      price: item.price,
      count: item.count
    }));
  
    //crio um resumo somente com id e count e descrisção para enviar a api que irá processar para ver se existe e está disponível a quantidade;
    const resumeItems = compressItems.map(item => ({
      _id: item._id,
      count: item.count,
      description: item.description
    }));
    //console.log(resumeItems)
    //crio um resumo somente com token, com o token irei indetificar o usuário que efetuou a compra, id e count para enviar a api que irá processar para ver se existe e está disponível a quantidade;
    const checkoutItems = compressItems.map(item => ({
      _idUser: decodedToken._id,
      _idItem: item._id,
      count: item.count,
    }));
    //console.log(checkoutItems)

    //preço a cobrar;
    let totalDemand = 0;
    for (const i of totalPrice) {
      const itemTotal = i.price * i.count; 
      totalDemand += itemTotal; 
    }
    //console.log(totalDemand)
    //quantidade totais de items que está o usuário está comprando;
    let quantityTotal = 0;
    for (const i of totalPrice) {
      const itemTotal =  i.count; 
      quantityTotal += itemTotal; 
    }
    /*console.log(quantityTotal) aqui a api da stripe internamente multiplica a quantidade pelo valor no lugar de somente mostra, creio que esta api era para item individual, eu adaptei para 
    processar mas de um pagamento, então coloco 1 na quantidade total para não cobrar a mais;*/
    
    try {
      const response = await axios.post('http://localhost:3000/user/api', { productId: resumeItems }, {
        headers: {
          authorization: token
        }
      });
      //põe em centavos que a api da stripe aceita;
      const priceInCents = totalDemand * 100;

      if(!response.status === 200){
        throw new Error('Alguns dos items não estão disponíveis, por favor atualize o carrinho.');
      }
      
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Total a pagar',
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `http://localhost:3001/success`,
        cancel_url: `http://localhost:3001/failed`,
        //envio o dados do checkout no metadata;
        metadata: {  
          resumeItems: JSON.stringify(checkoutItems)
        }
      });
      if (session) {
        //res.redirect(303, session.url); por algum motivo o redict estava dando erro, ai passo a url como response e faço no front o redirect;
        res.status(200).send(session.url);
      }
    } catch (error) {
      //console.log(error)
      const catchErr= error?.response?.data;
      //envio como resposta o erro indicando quais items não existe ou não estão disponíveis;
      res.status(500).send(catchErr);
    }
  }

  
} 
module.exports = apiController;
  