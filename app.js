const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");
let database = null;
let port = 3000;

const initializeDbServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server is Running at ${port}...`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbServer();
let categoryValues = ["WORK", "HOME", "LEARNING"];
let priorityValues = ["HIGH", "MEDIUM", "LOW"];
let statusValues = ["TO DO", "IN PROGRESS", "DONE"];

const convertJsonToObj = (jsonResponse) => {
  return {
    id: jsonResponse.id,
    todo: jsonResponse.todo,
    priority: jsonResponse.priority,
    category: jsonResponse.category,
    status: jsonResponse.status,
    dueDate: jsonResponse.due_date,
  };
};

const validateStatusPriorityValues = (requestQuery) => {
  return (
    priorityValues.includes(requestQuery.priority) &&
    statusValues.includes(requestQuery.status)
  );
};

const validateStatusCategoryValues = (requestQuery) => {
  return (
    categoryValues.includes(requestQuery.category) &&
    statusValues.includes(requestQuery.status)
  );
};

const validatePriorityCategoryValues = (requestQuery) => {
  return (
    categoryValues.includes(requestQuery.category) &&
    priorityValues.includes(requestQuery.priority)
  );
};

const validateCategoryValues = (requestQuery) => {
  return categoryValues.includes(requestQuery.category);
};

const validatePriorityValues = (requestQuery) => {
  return priorityValues.includes(requestQuery.priority);
};

const validateStatusValues = (requestQuery) => {
  return statusValues.includes(requestQuery.status);
};

const validateNewValues = (requestBody) => {};

//Get Todos based on query

app.get("/todos/", async (request, response) => {
  try {
    let isValid;
    let getTodoQuery;
    const { status, priority, category, search_q = "" } = request.query;
    switch (true) {
      case status !== undefined && priority !== undefined:
        isValid = validateStatusPriorityValues(request.query);
        if (isValid) {
          getTodoQuery = `
            SELECT * 
            FROM todo 
            WHERE status = '${status}' 
            AND priority = '${priority}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status,Priority");
        }
        break;

      case status !== undefined && category !== undefined:
        isValid = validateStatusCategoryValues(request.query);
        if (isValid) {
          getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE status = '${status}' 
        AND category = '${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status,Category");
        }
        break;

      case priority !== undefined && category !== undefined:
        isValid = validatePriorityCategoryValues(request.query);
        if (isValid) {
          getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE priority = '${priority}' 
        AND category = '${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status,Category");
        }
        break;

      case category !== undefined:
        isValid = validateCategoryValues(request.query);
        if (isValid) {
          getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE category = '${category}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }

        break;

      case status !== undefined:
        isValid = validateStatusValues(request.query);
        if (isValid) {
          getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE status = '${status}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        break;

      case priority !== undefined:
        isValid = validatePriorityValues(request.query);
        if (isValid) {
          getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE priority = '${priority}';`;
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        break;

      case search_q !== undefined:
        getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE todo LIKE '%${search_q}%';`;
        break;
    }
    if (getTodoQuery !== undefined) {
      const todosResult = await database.all(getTodoQuery);
      response.send(todosResult.map((eachObj) => convertJsonToObj(eachObj)));
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//Get Todos based on Id's

app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE id = ${todoId};`;
    const todoResult = await database.get(getTodoQuery);
    response.send({
      id: todoResult.id,
      todo: todoResult.todo,
      priority: todoResult.priority,
      category: todoResult.category,
      status: todoResult.status,
      dueDate: todoResult.due_date,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//Get list of all todos with a specific due date in the query parameter

app.get("/agenda/", async (request, response) => {
  try {
    let { date } = request.query;
    //formatDate = format(new Date(date), "yyyy-MM-dd");
    if (new Date(date) == "Invalid Date") {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      date = format(new Date(date), "yyyy-MM-dd");
      const getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE due_date = '${date}';`;
      const todosResult = await database.all(getTodoQuery);
      response.send(todosResult.map((eachObj) => convertJsonToObj(eachObj)));
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//Get list of all todos with a specific due date in the query parameter

app.post("/todos/", async (request, response) => {
  try {
    const { id, todo, status, priority, category, dueDate } = request.body;

    if (validateStatusValues(request.body)) {
      if (validatePriorityValues(request.body)) {
        if (validateCategoryValues(request.body)) {
          if (new Date(dueDate) == "Invalid Date") {
            response.status(400);
            response.send("Invalid Due Date");
          } else {
            let date = format(new Date(dueDate), "yyyy-MM-dd");
            const createTodoQuery = `
            INSERT INTO 
                todo (id,todo,status,priority,category,due_date )
            VALUES 
            ( ${id},
                '${todo}',
                '${status}',
                '${priority}',
                '${category}',
                '${date}' );`;
            await database.run(createTodoQuery);
            response.send("Todo Successfully Added");
          }
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//Get list of all todos with a specific due date in the query parameter

app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const { todo, status, priority, category, dueDate } = request.body;
    let updateTodoQuery = null;
    let columnName = null;
    let date;

    switch (true) {
      case todo !== undefined:
        updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId};`;
        columnName = "Todo";
        break;

      case category !== undefined:
        if (validateCategoryValues(request.body)) {
          updateTodoQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId};`;
          columnName = "Category";
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        break;

      case status !== undefined:
        if (validateStatusValues(request.body)) {
          updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId};`;
          columnName = "Status";
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        break;

      case priority !== undefined:
        if (validatePriorityValues(request.body)) {
          updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId};`;
          columnName = "Priority";
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        break;

      case dueDate !== undefined:
        if (new Date(dueDate) == "Invalid Date") {
          response.status(400);
          response.send("Invalid Due Date");
        } else {
          let date = format(new Date(dueDate), "yyyy-MM-dd");
          updateTodoQuery = `
            UPDATE
                todo
            SET 
                due_date = '${date}'
            WHERE 
                id = ${todoId};`;
          columnName = "Due Date";
        }
        break;
    }
    if (updateTodoQuery !== null && columnName !== null) {
      await database.run(updateTodoQuery);
      response.send(`${columnName} Updated`);
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//Deletes Todo based on TodoId

app.delete("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    //console.log(todoId);
    const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId} ;`;
    await database.run(deleteTodoQuery);
    response.send("Todo Deleted");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

module.exports = app;
