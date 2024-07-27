import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { profileEnd } from 'console';

// Initialize the CLI program
const program = new Command();

// Function to handle user input via command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const findBestMatch = (input, items) => {
  const results = fuzzy.filter(input, items);
  return results[0] ? results[0].string : null;
};

// Function to prompt user for file path
const promptFilePath = () => {
  return new Promise((resolve) => {
    rl.question('Where would you like to store your todos? ', (filePath) => {
      resolve(filePath);
    });
  });
};

// Function to get or create the todo file path
const getTodoFilePath = async () => {
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.clitodo-config.json');
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.filePath;
  } else {
    const filePath = await promptFilePath();
    fs.writeFileSync(configPath, JSON.stringify({ filePath }, null, 2));
    return filePath;
  }
};

// Function to add a todo item
const addTodo = async (todo, dueDate) => {
  const filePath = await getTodoFilePath();

  let todos = [];
  if (fs.existsSync(filePath)) {
    todos = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  if (!Array.isArray(todos)) {
    todos = [
        {
            "name": todo,
            "dueDate": dueDate || null
        }
    ];
  }

  todos.push({
    name: todo,
    dueDate: dueDate || null
  });

  fs.writeFileSync(filePath, JSON.stringify(todos, null, 2));
  console.log(chalk.green(`Done! Added "${todo}" to your todo list.`));
  process.exit(0);
};

const deleteTodo = async (todo) => {
  const filePath = await getTodoFilePath();

  let todos = [];
  if (fs.existsSync(filePath)) {
    todos = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  if (!Array.isArray(todos)) {
    console.log(chalk.red('JSON file must be in array format.'));
  }
  let amountOfTasksRemoved = 0;
  todos.forEach((item, index) => {
    if (item.name.toLowerCase() === todo.toLowerCase()) {
      amountOfTasksRemoved++;
      todos.splice(index, 1);
    }
  });
  if (amountOfTasksRemoved === 0) {
    console.log(chalk.red(`Didn't match any tasks named "${todo}".`));
    process.exit(1);
  } else {
  fs.writeFileSync(filePath, JSON.stringify(todos, null, 2));
  console.log(chalk.red(`Successfully removed 1 task${amountOfTasksRemoved - 1 > 0 ? ` and ${amountOfTasksRemoved} duplicate(s)` : ''} from your todo list.`));
  process.exit(0);
  }
};

// Function to list the contents of the JSON file
const listTodos = async () => {
  const filePath = await getTodoFilePath();

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const jsonContent = JSON.parse(data);
    console.log(chalk.green('Alright, here are your todos!\n'));
    jsonContent.forEach((todo) => {
      console.log(chalk.whiteBright(`${todo.name}${todo.dueDate ? ` (due ${todo.dueDate})` : ''}`));
    });
    process.exit(0);
  } else {
    console.log(chalk.red('The specified file does not exist.'));
    process.exit(1);
  }
};

// Set up CLI commands
program
  .command('add <todo> [dueDate]')
  .description('Add a new todo')
  .action(addTodo);

program
  .command('list')
  .description('List the contents of the JSON file')
  .action(listTodos);

program
  .command('delete <todoName>')
  .description('Delete a task from the todo list')
  .action(deleteTodo);

program.parse(process.argv);
