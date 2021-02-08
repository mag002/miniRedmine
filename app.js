var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/users');
var projectRouter = require('./routes/projects');
var taskRouter = require('./routes/tasks');

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
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
  },
  apis: ["routes/*"],
};

const specs = swaggerJsdoc(options);

// Settings apps
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    // explorer: true,
  })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.use('/', indexRouter);
app.use(userRouter);
app.use(projectRouter);
app.use(taskRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // next(createError(404));
  res.status(404).send({ message: "URL Not found", code: "URL_NOT_FOUND" })
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, () => {
  console.log("listening on 3000")
})