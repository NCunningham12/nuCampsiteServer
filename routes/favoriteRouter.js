const express = require('express');
const Favorite = require('../models/favorites');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');

favoriteRouter
    .route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            });
    })
    .post(cors.corsWithOptions, (req, res, next) => {
        Favorite.findOne({ user: req.body._id })
            .then((favorite) => {
                if (favorite) {
                    req.body.forEach((campsite) => {
                        if (!favorite.campsites.includes(campsite)) {
                            favorite.campsites.push(campsite);
                        }
                    });
                } else {
                    Favorite.create(req.body.campsites).then((favorite) => {
                        favorite.user = req.user._id;
                        req.body.forEach((campsite) => {
                            favorite.campsites.push(campsite);
                        });
                    });
                    favorite.save().then((favorite) => {
                        res.statusCode = 200;
                        console.log('Favorite Created', favorite);
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                }
            })
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(
        cors.corsWithOptions,
        authenticate.verifyAdmin,
        (req, res, next) => {
            if (Favorite) {
                Favorite.findOneAndDelete().then((response) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
                });
            } else {
                res.setHeader('Content-Type', 'text/plain');
                res.end(`You do not have any favorites to delete.`);
            }
        }
    );

favoriteRouter
    .route('./:campsiteId')
    .get(cors.corsWithOptions, (req, res) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/:campsiteId');
    })
    .post(cors.corsWithOptions, (req, res, next) => {
        Favorite.findOne({ user: req.body._id })
            .then((favorite) => {
                if (favorite) {
                    req.body.forEach((campsite) => {
                        if (!favorite.campsites.includes(campsite)) {
                            favorite.campsites.push(campsite);
                        }
                    });
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(
                        `That campsite is already in the list of favorites!`
                    );
                }
            })
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/:campsiteId');
    })
    .delete(cors.corsWithOptions, (req, res, next) => {
        Favorite.findOne({ user: req.body._id })
            .then((favorite) => {
                if (favorite) {
                    favorite.campsites.splice(
                        favorite.campsites.indexOf(req.params.campsiteId)
                    );
                    favorite.save().then((favorite) => {
                        res.statusCode = 200;
                        console.log('Favorite Removed', favorite);
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    });
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(`There are no favorites to delete!`);
                }
            })
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;
