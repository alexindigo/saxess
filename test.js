var path          = require('path')
  , tests         = Array.prototype.slice.call(process.argv, 2)
  , executedTests = 0
  , expectedTests = tests.length
  ;

// run all tests
tests.forEach(function(test)
{
  console.log('> ' + test);
  require(path.join(__dirname, test)) && executedTests++;
});

if (expectedTests)
{
  if (executedTests === expectedTests)
  {
    console.log('\nFinished executing all ' + executedTests + ' test(s).');
  }
  else
  {
    console.log('\nFinished executing ' + executedTests + ' out of ' + expectedTests + ' test(s).');
    process.exit(1);
  }
}
else
{
  console.log('No tests found.');
  process.exit(1);
}
