const Sauce = require('../models/Sauce')
const fs = require('fs')
const { Console } = require('console')


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce)
    sauceObject.likes = 0
    sauceObject.dislikes = 0
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })
    sauce.save()
        .then(() => res.status(201).json({message: 'Sauce enregistrée'}))
        .catch(error => {
            res.status(400).json({error})})
}

exports.likeOrDislike = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then((sauce) =>{
        let likes = sauce.likes
        let dislikes = sauce.dislikes
        let usersLikes = sauce.usersLiked
        let usersDislikes = sauce.usersDisliked
        if(req.body.like === 1){
            if(!sauce.usersLiked.includes(req.auth.userId)){
                likes++
                usersLikes.push(req.auth.userId)
            }
        }
        if(req.body.like === 0){
            if(sauce.usersLiked.includes(req.auth.userId)){
                likes--
                usersLikes.splice(usersLikes.indexOf(req.auth.userId), 1)
            } else if(sauce.usersDisliked.includes(req.auth.userId)){
                dislikes--
                usersDislikes.splice(usersDislikes.indexOf(req.auth.userId), 1)
            }
        }
        if(req.body.like == -1){
            if(!sauce.usersDisliked.includes(req.auth.userId)){
                dislikes++
                usersDislikes.push(req.auth.userId)
            }
        }
        Sauce.updateOne({_id: req.params.id}, {likes: likes, usersLiked: usersLikes, dislikes: dislikes, usersDisliked: usersDislikes})
        .then(() => res.status(200).json({ message: 'Like modifié !'}))
        .catch((error) => res.status(400).json({error}))
    })
    .catch((error) => res.status(400).json({error}))
    
} 

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }
    delete sauceObject._userId
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if(sauce.userId != req.auth.userId){
                res.status(401).json({message: 'Non-autorisé'})
            } else{
                Sauce.updateOne({_id: req.params.id}, {...req.body, _id: req.params.id})
                    .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
                    .catch(error => res.status(400).json({ error }))
            }
        })
        .catch((error) => res.status(400).json({error}))
        
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if(sauce.userId != req.auth.userId){
                res.status(401).json({message: 'Non-autorisé'})
            } else{
                const filename = sauce.imageUrl.split('/images/')[1]
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
                        .catch(error => res.status(400).json({error}))
                })
            }
        })
        .catch((error) => {
            res.status(400).json({error})
        })
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({error}))
}

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({error}))
  }