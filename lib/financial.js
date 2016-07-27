var error = require('./error');
var dateTime = require('./date-time');
var utils = require('../utils');
var _ = require('../utils/limited-lodash');

// TODO
exports.ACCRINT = function() {
 throw new Error('ACCRINT is not implemented');
};

// TODO
exports.ACCRINTM = function() {
 throw new Error('ACCRINTM is not implemented');
};

// TODO
exports.AMORDEGRC = function() {
 throw new Error('AMORDEGRC is not implemented');
};

// TODO
exports.AMORLINC = function() {
 throw new Error('AMORLINC is not implemented');
};

// TODO
exports.COUPDAYBS = function() {
 throw new Error('COUPDAYBS is not implemented');
};

// TODO
exports.COUPDAYS = function() {
 throw new Error('COUPDAYS is not implemented');
};

// TODO
exports.COUPDAYSNC = function() {
 throw new Error('COUPDAYSNC is not implemented');
};

// TODO
exports.COUPNCD = function() {
 throw new Error('COUPNCD is not implemented');
};

// TODO
exports.COUPNUM = function() {
 throw new Error('COUPNUM is not implemented');
};

// TODO
exports.COUPPCD = function() {
 throw new Error('COUPPCD is not implemented');
};

exports.CUMIPMT = function(rate, periods, value, start, end, type) {
  // Credits: algorithm inspired by Apache OpenOffice
  // Credits: Hannes Stiebitzhofer for the translations of function and variable names
  // Requires exports.FV() and exports.PMT() from exports.js [http://stoic.com/exports/]

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  value = utils.parseNumber(value);
  if (value instanceof Error) {
    return value;
  }

  // Return error if either rate, periods, or value are lower than or equal to zero
  if (rate <= 0 || periods <= 0 || value <= 0) {
    return error.num;
  }

  // Return error if start < 1, end < 1, or start > end
  if (start < 1 || end < 1 || start > end) {
    return error.num;
  }

  // Return error if type is neither 0 nor 1
  if (type !== 0 && type !== 1) {
    return error.num;
  }

  // Compute cumulative interest
  var payment = exports.PMT(rate, periods, value, 0, type);
  var interest = 0;

  if (start === 1) {
    if (type === 0) {
      interest = -value;
      start++;
    }
  }

  for (var i = start; i <= end; i++) {
    if (type === 1) {
      interest += exports.FV(rate, i - 2, payment, value, 1) - payment;
    } else {
      interest += exports.FV(rate, i - 1, payment, value, 0);
    }
  }
  interest *= rate;

  // Return cumulative interest
  return interest;
};

exports.CUMPRINC = function(rate, periods, value, start, end, type) {
  // Credits: algorithm inspired by Apache OpenOffice
  // Credits: Hannes Stiebitzhofer for the translations of function and variable names

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  value = utils.parseNumber(value);
  if (value instanceof Error) {
    return value;
  }

  // Return error if either rate, periods, or value are lower than or equal to zero
  if (rate <= 0 || periods <= 0 || value <= 0) {
    return error.num;
  }

  // Return error if start < 1, end < 1, or start > end
  if (start < 1 || end < 1 || start > end) {
    return error.num;
  }

  // Return error if type is neither 0 nor 1
  if (type !== 0 && type !== 1) {
    return error.num;
  }

  // Compute cumulative principal
  var payment = exports.PMT(rate, periods, value, 0, type);
  var principal = 0;
  if (start === 1) {
    if (type === 0) {
      principal = payment + value * rate;
    } else {
      principal = payment;
    }
    start++;
  }
  for (var i = start; i <= end; i++) {
    if (type > 0) {
      principal += payment - (exports.FV(rate, i - 2, payment, value, 1) - payment) * rate;
    } else {
      principal += payment - exports.FV(rate, i - 1, payment, value, 0) * rate;
    }
  }

  // Return cumulative principal
  return principal;
};

exports.DB = function(cost, salvage, life, period, month) {
  // Initialize month
  month = (month === undefined) ? 12 : month;

  cost = utils.parseNumber(cost);
  if (cost instanceof Error) {
    return cost;
  }
  salvage = utils.parseNumber(salvage);
  if (salvage instanceof Error) {
    return salvage;
  }
  life = utils.parseNumber(life);
  if (life instanceof Error) {
    return life;
  }
  period = utils.parseNumber(period);
  if (period instanceof Error) {
    return period;
  }
  month = utils.parseNumber(month);
  if (month instanceof Error) {
    return month;
  }

  // Return error if any of the parameters is negative
  if (cost < 0 || salvage < 0 || life < 0 || period < 0) {
    return error.num;
  }

  // Return error if month is not an integer between 1 and 12
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(month) === -1) {
    return error.num;
  }

  // Return error if period is greater than life
  if (period > life) {
    return error.num;
  }

  // Return 0 (zero) if salvage is greater than or equal to cost
  if (salvage >= cost) {
    return 0;
  }

  // Rate is rounded to three decimals places
  var rate = (1 - Math.pow(salvage / cost, 1 / life)).toFixed(3);

  // Compute initial depreciation
  var initial = cost * rate * month / 12;

  // Compute total depreciation
  var total = initial;
  var current = 0;
  var ceiling = (period === life) ? life - 1 : period;
  for (var i = 2; i <= ceiling; i++) {
    current = (cost - total) * rate;
    total += current;
  }

  // Depreciation for the first and last periods are special cases
  if (period === 1) {
    // First period
    return initial;
  } else if (period === life) {
    // Last period
    return (cost - total) * rate;
  } else {
    return current;
  }
};

exports.DDB = function(cost, salvage, life, period, factor) {
  // Initialize factor
  factor = (factor === undefined) ? 2 : factor;

  cost = utils.parseNumber(cost);
  if (cost instanceof Error) {
    return cost;
  }
  salvage = utils.parseNumber(salvage);
  if (salvage instanceof Error) {
    return salvage;
  }
  life = utils.parseNumber(life);
  if (life instanceof Error) {
    return life;
  }
  period = utils.parseNumber(period);
  if (period instanceof Error) {
    return period;
  }
  factor = utils.parseNumber(factor);
  if (factor instanceof Error) {
    return factor;
  }

  // Return error if any of the parameters is negative or if factor is null
  if (cost < 0 || salvage < 0 || life < 0 || period < 0 || factor <= 0) {
    return error.num;
  }

  // Return error if period is greater than life
  if (period > life) {
    return error.num;
  }

  // Return 0 (zero) if salvage is greater than or equal to cost
  if (salvage >= cost) {
    return 0;
  }

  // Compute depreciation
  var total = 0;
  var current = 0;
  for (var i = 1; i <= period; i++) {
    current = Math.min((cost - total) * (factor / life), (cost - salvage - total));
    total += current;
  }

  // Return depreciation
  return current;
};

// TODO
exports.DISC = function() {
 throw new Error('DISC is not implemented');
};

exports.DOLLARDE = function(dollar, fraction) {
  // Credits: algorithm inspired by Apache OpenOffice

  dollar = utils.parseNumber(dollar);
  if (dollar instanceof Error) {
    return dollar;
  }
  fraction = utils.parseNumber(fraction);
  if (fraction instanceof Error) {
    return fraction;
  }

  // Return error if fraction is negative
  if (fraction < 0) {
    return error.num;
  }

  // Return error if fraction is greater than or equal to 0 and less than 1
  if (fraction >= 0 && fraction < 1) {
    return error.div0;
  }

  // Truncate fraction if it is not an integer
  fraction = parseInt(fraction, 10);

  // Compute integer part
  var result = parseInt(dollar, 10);

  // Add decimal part
  result += (dollar % 1) * Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN10)) / fraction;

  // Round result
  var power = Math.pow(10, Math.ceil(Math.log(fraction) / Math.LN2) + 1);
  result = Math.round(result * power) / power;

  // Return converted dollar price
  return result;
};

exports.DOLLARFR = function(dollar, fraction) {
  // Credits: algorithm inspired by Apache OpenOffice

  dollar = utils.parseNumber(dollar);
  if (dollar instanceof Error) {
    return dollar;
  }
  fraction = utils.parseNumber(fraction);
  if (fraction instanceof Error) {
    return fraction;
  }

  // Return error if fraction is negative
  if (fraction < 0) {
    return error.num;
  }

  // Return error if fraction is greater than or equal to 0 and less than 1
  if (fraction >= 0 && fraction < 1) {
    return error.div0;
  }

  // Truncate fraction if it is not an integer
  fraction = parseInt(fraction, 10);

  // Compute integer part
  var result = parseInt(dollar, 10);

  // Add decimal part
  result += (dollar % 1) * Math.pow(10, -Math.ceil(Math.log(fraction) / Math.LN10)) * fraction;

  // Return converted dollar price
  return result;
};

// TODO
exports.DURATION = function() {
 throw new Error('DURATION is not implemented');
};

exports.EFFECT = function(rate, periods) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }

  // Return error if rate <=0 or periods < 1
  if (rate <= 0 || periods < 1) {
    return error.num;
  }

  // Truncate periods if it is not an integer
  periods = parseInt(periods, 10);

  // Return effective annual interest rate
  return Math.pow(1 + rate / periods, periods) - 1;
};

exports.FV = function(rate, periods, payment, value, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  value = value || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  payment = utils.parseNumber(payment);
  if (payment instanceof Error) {
    return payment;
  }
  value = utils.parseNumber(value);
  if (value instanceof Error) {
    return value;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  // Return future value
  var result;
  if (rate === 0) {
    result = value + payment * periods;
  } else {
    var term = Math.pow(1 + rate, periods);
    if (type === 1) {
      result = value * term + payment * (1 + rate) * (term - 1) / rate;
    } else {
      result = value * term + payment * (term - 1) / rate;
    }
  }
  return -result;
};

exports.FVSCHEDULE = function(principal, schedule) {
  principal = utils.parseNumber(principal);
  if (principal instanceof Error) {
    return principal;
  }
  schedule = utils.parseNumbers(_.flatten(schedule));
  if (schedule instanceof Error) {
    return schedule;
  }

  var n = schedule.length;
  var future = principal;

  // Apply all interests in schedule
  for (var i = 0; i < n; i++) {
    // Apply scheduled interest
    future *= 1 + schedule[i];
  }

  // Return future value
  return future;
};

// TODO
exports.INTRATE = function() {
 throw new Error('INTRATE is not implemented');
};

exports.IPMT = function(rate, period, periods, present, future, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  period = utils.parseNumber(period);
  if (period instanceof Error) {
    return period;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  // Compute payment
  var payment = exports.PMT(rate, periods, present, future, type);

  // Compute interest
  var interest;
  if (period === 1) {
    if (type === 1) {
      interest = 0;
    } else {
      interest = -present;
    }
  } else {
    if (type === 1) {
      interest = exports.FV(rate, period - 2, payment, present, 1) - payment;
    } else {
      interest = exports.FV(rate, period - 1, payment, present, 0);
    }
  }

  // Return interest
  return interest * rate;
};

exports.IRR = function(values, guess) {
  // Credits: algorithm inspired by Apache OpenOffice

  guess = guess || 0;
  values = utils.parseNumbers(_.flatten(values));
  if (values instanceof Error) {
    return values;
  }
  guess = utils.parseNumber(guess);
  if (guess instanceof Error) {
    return guess;
  }

  // Calculates the resulting amount
  var irrResult = function(values, dates, rate) {
    var r = rate + 1;
    var result = values[0];
    for (var i = 1; i < values.length; i++) {
      result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
    }
    return result;
  };

  // Calculates the first derivation
  var irrResultDeriv = function(values, dates, rate) {
    var r = rate + 1;
    var result = 0;
    for (var i = 1; i < values.length; i++) {
      var frac = (dates[i] - dates[0]) / 365;
      result -= frac * values[i] / Math.pow(r, frac + 1);
    }
    return result;
  };

  // Initialize dates and check that values contains at least one positive value and one negative value
  var dates = [];
  var positive = false;
  var negative = false;
  for (var i = 0; i < values.length; i++) {
    dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
    if (values[i] > 0) {
      positive = true;
    }
    if (values[i] < 0) {
      negative = true;
    }
  }

  // Return error if values does not contain at least one positive value and one negative value
  if (!positive || !negative) {
    return error.num;
  }

  // Initialize guess and resultRate
  guess = (guess === undefined) ? 0.1 : guess;
  var resultRate = guess;

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Implement Newton's method
  var newRate, epsRate, resultValue;
  var iteration = 0;
  var contLoop = true;
  do {
    resultValue = irrResult(values, dates, resultRate);
    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
    epsRate = Math.abs(newRate - resultRate);
    resultRate = newRate;
    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
  } while (contLoop);

  // Return internal rate of return
  return resultRate;
};

exports.ISPMT = function(rate, period, periods, value) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  period = utils.parseNumber(period);
  if (period instanceof Error) {
    return period;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  value = utils.parseNumber(value);
  if (value instanceof Error) {
    return value;
  }

  // Return interest
  return value * rate * (period / periods - 1);
};

// TODO
exports.MDURATION = function() {
 throw new Error('MDURATION is not implemented');
};

exports.MIRR = function(values, finance_rate, reinvest_rate) {
  values = utils.parseNumbers(_.flatten(values));
  if (values instanceof Error) {
    return values;
  }
  finance_rate = utils.parseNumber(finance_rate);
  if (finance_rate instanceof Error) {
    return finance_rate;
  }
  reinvest_rate = utils.parseNumber(reinvest_rate);
  if (reinvest_rate instanceof Error) {
    return reinvest_rate;
  }

  // Initialize number of values
  var n = values.length;

  // Lookup payments (negative values) and incomes (positive values)
  var payments = [];
  var incomes = [];
  for (var i = 0; i < n; i++) {
    if (values[i] < 0) {
      payments.push(values[i]);
    } else {
      incomes.push(values[i]);
    }
  }

  // Return modified internal rate of return
  var num = -exports.NPV(reinvest_rate, incomes) * Math.pow(1 + reinvest_rate, n - 1);
  var den = exports.NPV(finance_rate, payments) * (1 + finance_rate);
  return Math.pow(num / den, 1 / (n - 1)) - 1;
};

exports.NOMINAL = function(rate, periods) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }

  // Return error if rate <=0 or periods < 1
  if (rate <= 0 || periods < 1) {
    return error.num;
  }

  // Truncate periods if it is not an integer
  periods = parseInt(periods, 10);

  // Return nominal annual interest rate
  return (Math.pow(rate + 1, 1 / periods) - 1) * periods;
};

exports.NPER = function(rate, payment, present, future, type) {
  type = (type === undefined) ? 0 : type;
  future = (future === undefined) ? 0 : future;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  payment = utils.parseNumber(payment);
  if (payment instanceof Error) {
    return payment;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  // Return number of periods
  var num = payment * (1 + rate * type) - future * rate;
  var den = (present * rate + payment * (1 + rate * type));
  return Math.log(num / den) / Math.log(1 + rate);
};

exports.NPV = function(rate) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }

  var args = utils.parseNumbers(_.flatten(arguments));

  // Initialize net present value
  var value = 0;

  // Loop on all values
  for (var j = 1; j < args.length; j++) {
    value += args[j] / Math.pow(1 + rate, j);
  }

  // Return net present value
  return value;
};

// TODO
exports.ODDFPRICE = function() {
 throw new Error('ODDFPRICE is not implemented');
};

// TODO
exports.ODDFYIELD = function() {
 throw new Error('ODDFYIELD is not implemented');
};

// TODO
exports.ODDLPRICE = function() {
 throw new Error('ODDLPRICE is not implemented');
};

// TODO
exports.ODDLYIELD = function() {
 throw new Error('ODDLYIELD is not implemented');
};

exports.PDURATION = function(rate, present, future) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }

  // Return error if rate <=0
  if (rate <= 0) {
    return error.num;
  }

  // Return number of periods
  return (Math.log(future) - Math.log(present)) / Math.log(1 + rate);
};

exports.PMT = function(rate, periods, present, future, type) {
  // Credits: algorithm inspired by Apache OpenOffice

  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  // Return payment
  var result;
  if (rate === 0) {
    result = (present + future) / periods;
  } else {
    var term = Math.pow(1 + rate, periods);
    if (type === 1) {
      result = (future * rate / (term - 1) + present * rate / (1 - 1 / term)) / (1 + rate);
    } else {
      result = future * rate / (term - 1) + present * rate / (1 - 1 / term);
    }
  }
  return -result;
};

exports.PPMT = function(rate, period, periods, present, future, type) {
  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  return exports.PMT(rate, periods, present, future, type) - exports.IPMT(rate, period, periods, present, future, type);
};

// TODO
exports.PRICE = function() {
 throw new Error('PRICE is not implemented');
};

// TODO
exports.PRICEDISC = function() {
 throw new Error('PRICEDISC is not implemented');
};

// TODO
exports.PRICEMAT = function() {
 throw new Error('PRICEMAT is not implemented');
};

exports.PV = function(rate, periods, payment, future, type) {
  future = future || 0;
  type = type || 0;

  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  payment = utils.parseNumber(payment);
  if (payment instanceof Error) {
    return payment;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }

  // Return present value
  if (rate === 0) {
    return -payment * periods - future;
  } else {
    return (((1 - Math.pow(1 + rate, periods)) / rate) * payment * (1 + rate * type) - future) / Math.pow(1 + rate, periods);
  }
};

exports.RATE = function(periods, payment, present, future, type, guess) {
  // Credits: rabugento

  guess = (guess === undefined) ? 0.01 : guess;
  future = (future === undefined) ? 0 : future;
  type = (type === undefined) ? 0 : type;

  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  payment = utils.parseNumber(payment);
  if (payment instanceof Error) {
    return payment;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }
  type = utils.parseNumber(type);
  if (type instanceof Error) {
    return type;
  }
  guess = utils.parseNumber(guess);
  if (guess instanceof Error) {
    return guess;
  }

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Set maximum number of iterations
  var iterMax = 50;

  // Implement Newton's method
  var y, y0, y1, x0, x1 = 0,
    f = 0,
    i = 0;
  var rate = guess;
  if (Math.abs(rate) < epsMax) {
    y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
  } else {
    f = Math.exp(periods * Math.log(1 + rate));
    y = present * f + payment * (1 / rate + type) * (f - 1) + future;
  }
  y0 = present + payment * periods + future;
  y1 = present * f + payment * (1 / rate + type) * (f - 1) + future;
  i = x0 = 0;
  x1 = rate;
  while ((Math.abs(y0 - y1) > epsMax) && (i < iterMax)) {
    rate = (y1 * x0 - y0 * x1) / (y1 - y0);
    x0 = x1;
    x1 = rate;
    if (Math.abs(rate) < epsMax) {
      y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
    } else {
      f = Math.exp(periods * Math.log(1 + rate));
      y = present * f + payment * (1 / rate + type) * (f - 1) + future;
    }
    y0 = y1;
    y1 = y;
    ++i;
  }
  return rate;
};

// TODO
exports.RECEIVED = function() {
 throw new Error('RECEIVED is not implemented');
};

exports.RRI = function(periods, present, future) {
  periods = utils.parseNumber(periods);
  if (periods instanceof Error) {
    return periods;
  }
  present = utils.parseNumber(present);
  if (present instanceof Error) {
    return present;
  }
  future = utils.parseNumber(future);
  if (future instanceof Error) {
    return future;
  }

  // Return error if periods or present is equal to 0 (zero)
  if (periods === 0 || present === 0) {
    return error.num;
  }

  // Return equivalent interest rate
  return Math.pow(future / present, 1 / periods) - 1;
};

exports.SLN = function(cost, salvage, life) {
  cost = utils.parseNumber(cost);
  if (cost instanceof Error) {
    return cost;
  }
  salvage = utils.parseNumber(salvage);
  if (salvage instanceof Error) {
    return salvage;
  }
  life = utils.parseNumber(life);
  if (life instanceof Error) {
    return life;
  }

  // Return error if life equal to 0 (zero)
  if (life === 0) {
    return error.num;
  }

  // Return straight-line depreciation
  return (cost - salvage) / life;
};

exports.SYD = function(cost, salvage, life, period) {
  // Return error if any of the parameters is not a number
  cost = utils.parseNumber(cost);
  if (cost instanceof Error) {
    return cost;
  }
  salvage = utils.parseNumber(salvage);
  if (salvage instanceof Error) {
    return salvage;
  }
  life = utils.parseNumber(life);
  if (life instanceof Error) {
    return life;
  }
  period = utils.parseNumber(period);
  if (period instanceof Error) {
    return period;
  }

  // Return error if life equal to 0 (zero)
  if (life === 0) {
    return error.num;
  }

  // Return error if period is lower than 1 or greater than life
  if (period < 1 || period > life) {
    return error.num;
  }

  // Truncate period if it is not an integer
  period = parseInt(period, 10);

  // Return straight-line depreciation
  return ((cost - salvage) * (life - period + 1) * 2) / (life * (life + 1));
};

exports.TBILLEQ = function(settlement, maturity, discount) {
  settlement = utils.parseDate(settlement);
  if (settlement instanceof Error) {
    return settlement;
  }
  maturity = utils.parseDate(maturity);
  if (maturity instanceof Error) {
    return maturity;
  }
  discount = utils.parseNumber(discount);
  if (discount instanceof Error) {
    return discount;
  }

  // Return error if discount is lower than or equal to zero
  if (discount <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return (365 * discount) / (360 - discount * dateTime.DAYS360(settlement, maturity, false));
};

exports.TBILLPRICE = function(settlement, maturity, discount) {
  settlement = utils.parseDate(settlement);
  if (settlement instanceof Error) {
    return settlement;
  }
  maturity = utils.parseDate(maturity);
  if (maturity instanceof Error) {
    return maturity;
  }
  discount = utils.parseNumber(discount);
  if (discount instanceof Error) {
    return discount;
  }

  // Return error if discount is lower than or equal to zero
  if (discount <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return 100 * (1 - discount * dateTime.DAYS360(settlement, maturity, false) / 360);
};

exports.TBILLYIELD = function(settlement, maturity, price) {
  settlement = utils.parseDate(settlement);
  if (settlement instanceof Error) {
    return settlement;
  }
  maturity = utils.parseDate(maturity);
  if (maturity instanceof Error) {
    return maturity;
  }
  price = utils.parseNumber(price);
  if (price instanceof Error) {
    return price;
  }

  // Return error if price is lower than or equal to zero
  if (price <= 0) {
    return error.num;
  }

  // Return error if settlement is greater than maturity
  if (settlement > maturity) {
    return error.num;
  }

  // Return error if maturity is more than one year after settlement
  if (maturity - settlement > 365 * 24 * 60 * 60 * 1000) {
    return error.num;
  }

  // Return bond-equivalent yield
  return (100 - price) * 360 / (price * dateTime.DAYS360(settlement, maturity, false));
};

// TODO
exports.VDB = function() {
 throw new Error('VDB is not implemented');
};


exports.XIRR = function(values, dates, guess) {
  // Credits: algorithm inspired by Apache OpenOffice

  values = utils.parseNumbers(_.flatten(values));
  if (values instanceof Error) {
    return values;
  }
  dates = utils.parseDates(_.flatten(dates));
  if (dates instanceof Error) {
    return dates;
  }
  guess = utils.parseNumber(guess);
  if (guess instanceof Error) {
    return guess;
  }

  // Calculates the resulting amount
  var irrResult = function(values, dates, rate) {
    var r = rate + 1;
    var result = values[0];
    for (var i = 1; i < values.length; i++) {
      result += values[i] / Math.pow(r, dateTime.DAYS(dates[i], dates[0]) / 365);
    }
    return result;
  };

  // Calculates the first derivation
  var irrResultDeriv = function(values, dates, rate) {
    var r = rate + 1;
    var result = 0;
    for (var i = 1; i < values.length; i++) {
      var frac = dateTime.DAYS(dates[i], dates[0]) / 365;
      result -= frac * values[i] / Math.pow(r, frac + 1);
    }
    return result;
  };

  // Check that values contains at least one positive value and one negative value
  var positive = false;
  var negative = false;
  for (var i = 0; i < values.length; i++) {
    if (values[i] > 0) {
      positive = true;
    }
    if (values[i] < 0) {
      negative = true;
    }
  }

  // Return error if values does not contain at least one positive value and one negative value
  if (!positive || !negative) {
    return error.num;
  }

  // Initialize guess and resultRate
  guess = guess || 0.1;
  var resultRate = guess;

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Implement Newton's method
  var newRate, epsRate, resultValue;
  var iteration = 0;
  var contLoop = true;
  do {
    resultValue = irrResult(values, dates, resultRate);
    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
    epsRate = Math.abs(newRate - resultRate);
    resultRate = newRate;
    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
  } while (contLoop);

  // Return internal rate of return
  return resultRate;
};

exports.XNPV = function(rate, values, dates) {
  rate = utils.parseNumber(rate);
  if (rate instanceof Error) {
    return rate;
  }
  values = utils.parseNumbers(_.flatten(values));
  if (values instanceof Error) {
    return values;
  }
  dates = utils.parseDates(_.flatten(dates));
  if (dates instanceof Error) {
    return dates;
  }

  var result = 0;
  for (var i = 0; i < values.length; i++) {
    result += values[i] / Math.pow(1 + rate, dateTime.DAYS(dates[i], dates[0]) / 365);
  }
  return result;
};

// TODO
exports.YIELD = function() {
 throw new Error('YIELD is not implemented');
};

// TODO
exports.YIELDDISC = function() {
 throw new Error('YIELDDISC is not implemented');
};

// TODO
exports.YIELDMAT = function() {
 throw new Error('YIELDMAT is not implemented');
};
