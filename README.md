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
1. Go to [webuntis](https://asopo.webuntis.com/WebUntis/#/basic/login)
2. Select your school and log in
3. Open the console (`F12`) and select `network`
4. Select `My Scedule` in webuntis
5. Search the `GET`-Request with the url `https://asopo.webuntis.com/WebUntis/api/public/timetable/weekly/data` and the following parameters `elementType`, `elementId`, `date` and `formatId`
6. The value of `elementId` is your timetableId

Hint: The request url will probably be displayed as `data?` followed by the parameters.

## Run

```shell
npm run start <weeks-ago>
```

Note: `--auto` has been removed. Every week will be requested and parsed, you'll see some output in the console, at the end the output you've seen will be written into `reports.txt` (will be created if it doesn't exist).

# Example

```shell
npm run start 4
```

This will start at the current date - 4 weeks and will show you the teaching content of all the following weeks until today.
