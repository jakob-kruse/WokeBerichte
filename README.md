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
A description how to get the id will be added soon™.

## Run

```shell
npm run start -- <weeks-ago>
```

Note: `--auto` has been removed. Every week will be requested and parsed, you'll see some output in the console, at the end the output you've seen will be written into `reports.txt` (will be created if it doesn't exist).

# Example

```shell
npm run start 4
```

This will start at the current date - 4 weeks and will show you the teaching content of all the following weeks until today.
