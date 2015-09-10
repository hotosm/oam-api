# Open Aerial Map Performance Testing:  Load Testing Scirpts

The `run-siege-one-use-case.sh` and `run-siege-random-use-case.sh` scripts use [Siege](https://www.joedog.org/siege-home/) to send different numbers of requests to the OAM Catalog service.

To get Siege running on a new Ubuntu VPS (also works on OSX as long as there is a C compiler installed):

1.   `wget http://download.joedog.org/siege/siege-3.1.0.tar.gz`
2. `tar xvzf siege-3.1.0.tar.gz`
3. `sudo apt-get update`
4. `sudo apt-get install build-essential`
5. `cd siege-3.1.0/`
6. `./configure`
7. `make`
8. `sudo make install`

The shell scripts assume they're being run as a user named `oam`.

To run one of the scripts via a cron job once a minute:
```  
* * * * * /home/oam/oam-catalog-load-tests/run-siege-static.sh
 ```
 
For the [bench-rest](https://www.npmjs.com/package/bench-rest) script, `npm install bench-rest` then run `bench-rest-test.js`.