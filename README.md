# WokeBerichte

# Usage

## Clone this repo

```shell
git clone https://github.com/jakob-kruse/WokeBerichte WokeBerichte

cd WokeBerichte
```

## Install dependencies

```shell
npm install
```

## Create and fill the env file

```shell
touch .env
```

See .env.example for the environment variables

## TimetableId
Jump to the ToDo and change the timetableId to your own.
A description how to get the id will be added soon™, at the same time the id will be moved to the .env file.

## Run

```shell
npm run start -- <weeks-ago> [--auto]
```

Note: `--auto` will not ask you to confirm after every week and will just continue

# Example

```shell
npm run start 4
```

This will start at the current date - 4 weeks and will show you the teaching content of all the following weeks until today.
