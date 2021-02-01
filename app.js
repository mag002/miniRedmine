var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

require("./db/mongoose");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
swaggerJsdoc = require("swagger-jsdoc");
const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "LogRocket Express API with Swagger",
      version: "0.1.0",

    },
    components: {
      securitySchemes:{
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: {
      bearerAuth: []
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
  },
  apis: ["routes/users.js"],
};

const specs = swaggerJsdoc(options);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs,  { 
    // explorer: true,
    swaggerOptions: {
      authAction :{ 
        JWT: {
          name: "JWT", 
          schema: {
            type: "apiKey", 
            in: "header", 
            name: "Authorization", 
            description: ""
          }, 
          value: "Bearer <JWT>"
        } 
      },
    }
  })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/books', (req,res)=>{
  res.send([{
    id:1,
    title:'abc'
  }])
})
app.use('/', indexRouter);
app.use(usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, ()=>{
  console.log("listening on 3000")
})