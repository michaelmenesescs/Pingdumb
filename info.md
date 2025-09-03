# Website Status Monitor

## Introduction

The goal of this exercise is to build a small application (either web application or native) to monitor the uptime of websites, especially ones that you do not have control over.  "Uptime" refers to how long (or for what percentage of time) a website has been active and responsive. Below we prescribe a strategy for calculating uptime, define a few functional requirements, and define a few UI requirements of the exercise. At the end, the app might look something like this:

<img src="cartoon.png" style="zoom:40%;" />

**Your text layout, color choices, plotting approach, etc. may vastly differ!** This is just a cartoon example of the kind of data we expect to see.

## Requirements

Unfortunately, we do not have the ability to calculate uptime exactly. If you do not have control over the server for which uptime is being measured, then uptime can only be estimated by periodically interacting with that server.  As such, we have to sample the status of the server to get an estimate for uptime. Every $T$ seconds, called the *sampling period*, we send an HTTP request to the server(s) of interest, and wait for a successful response.

_**Requirement 1**: Your app shall allow a configurable sampling period $T$, with a minumum sampling period of 1 second, and a maximum sampling period of 5 minutes._

What counts as a "successful response"? If the server responds with a 200-class status code, then the response was successful. If the server either responds with a non-200 class status code, or the request times out, then the response was a failure.

Uptime over an interval of time is thus calculated as a percentage figure: number of successful samples divided by the total number of samples.

_**Requirement 2**: Your app shall allow a configurable uptime interval. The interval shall always end at the current time, and its duration shall support a minimum of 1 minute._

The application will be used to monitor websites of the user's choice.

_**Requirement 3**: Your app shall allow the user to add at least 5 websites to monitor, specified via a URL, and optional port. Your app shall also support removing websites._

_**Requirement 4**: Your app shall allow globally starting or stopping metering._

_**Requirement 5**: Requests shall be ordinary GET requests._

The user interface does not need to be very fancy or extremely elaborate. However, it must be minimally functional and visually useful. Uptime is calculated and plotted on graphs. Since the notion of a "successful response" is binary (and therefore not very interesting to visualize), we instead plot latency against time. _Latency_ is the amount of time elapsed between the request and a successful response. 

_**Requirement 6**: Your app shall show a time-series plot for each website being measured. The timeseries plots shall show latency of each successful request in milliseconds on the vertical axis. The horizontal axis should be absolute time. Failures shall be displayed in a visually distinct and identifiable way. The time-series plot may be a bar graph, a line graph, a scatter plot, or any other reasonable plot to communicate the required data._

Please note that **it is acceptable** to use a library to do the plotting.

_**Requirement 7**: The uptime over the configured time interval shall be displayed nearby the plot as a percentage._

Most of the time, a user might want to use this application as a dashboard and see the results live without interacting with it. We make this a purely optional feature.

_**Optional Extra Credit 1**: The plot should update live and not require a browser refresh._

Your app does not need to maintain any state. If you close the user interface to your app (e.g., the browser), the app does not need to continue running. If you close the app itself (e.g., the web server), the uptime data does not need to be maintained. However, we invite you to add persistence to your app, so that if you close and re-open the app, it will continue with all data intact.

_**Optional Extra Credit 2**: Add persistence to the app._

In order to test the application, you must implement a small web server that has a configurable uptime. If you're using Python, your server might be invoked as:

```
python test_server.py 1234 0.75
```

to start a server on port `1234` with an uptime of $75\%$. (You may make whatever decision you please on the interface, file name, implementation language, etc. This is just an example.)

_**Requirement 8**: You shall have a small test server that has a configurable port and uptime percentage._

Please note that **it is acceptable** to use a library to create the server, and that the server does **not** have to do anything useful.

Lastly, to wrap things up, you'll run your app for 5 minutes and take a screenshot.

_**Requirement 9**: After 5 minutes of activity, screenshot of your app shall be captured with 5 websites (including your test server with a 75% uptime percentage) being metered with a configured sampling period of 5 seconds and a configured interval of 2 minutes._

## Meta-requirements

**Terminology**: Above, we may have used programming terms like "function," "type," "constructor," etc. These terms are being used broadly, and may be interpreted however you please in your programming language. For example, something specified above to be a "function" may be implemented in your programming language as a method, procedure, subroutine, or otherwise.

**Naming Conventions**: You do _not_ need to match the function and variable names exactly. Please feel free to choose whichever names you prefer and whichever names would be idiomatic in your programming language.

**Language**: You code can be written in any language of your choice. We prefer—but do not require—C++, Python, JavaScript, or Common Lisp. If it's not one of those, we'd like instructions on how to run your code as simply as possible.

**Libraries**: Feel free to use any **easily-accessible** libraries that are utilitarian in nature. Do not use libraries with complicated installation requirements. (It's typically safe to just rely on language-standard libraries.) Do not use library functionality which directly solves any of the challenges.

**Operating System**: Your code should work on a UNIX system, like Linux or macOS. If this is not feasible for you, please let us know ahead of time.

**Quality**: We know that this is a take-home exercise, and time constrains one's ability to make such a project fully robust. We ask that you code to your usual standard, but if shortcuts shall be made, to clearly mark them.

**Version Control**: Do as you would in an ordinary, professional project. You may, if convenient, share a private GitHub repository with us.

**Testing**: Do as you see fit, noting the flexibility of the "quality" requirement above.

**Documentation**: Documentation should be done as you see fit, noting the flexibility of the "quality" requirement above.

The code you write is owned completely by you, and of course may be repurposed or used for anything you please. However, **we humbly request that the code you write as it pertains to this exercise remains private so others have a fair chance**.

## Judgment criteria

You will be judged on overall software engineering quality, broad efficiency considerations (i.e., we are looking at big design choices, not micro-optimizations), and the extent to which your code satisfies the requirements outlined in this document.