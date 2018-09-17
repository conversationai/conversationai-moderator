#!/bin/bash
npx sequelize migration:create --config ../config/sequelize.js --migrations-path src/migrations --name $1
