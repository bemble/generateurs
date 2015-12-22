(function() {
  'use strict';

  function StringUtils() {}
  StringUtils.padLeft = function(value, length, fillValue) {
    var fill = (new Array(length+1)).join(fillValue);
    return fill.substring(0, length - value.toString().length) + value;
  };
  StringUtils.padLeftWithZeros = function(value, length) {
    return StringUtils.padLeft(value, length, '0');
  };
  StringUtils.randomUpperLetters = function(nb) {
    function rlcc(){
      return 65 + Math.ceil(Math.random() * 25);
    }
    var charCodeLetters = [];
    for(var i = 0; i < nb; i++) {
      charCodeLetters.push(rlcc());
    }
    return String.fromCharCode.apply(null, charCodeLetters);
  };

  function NumberUtils() {}
  NumberUtils.getPaddedRandomNumber = function(maxValue) {
    var num = Math.ceil(Math.random() * maxValue);
    return StringUtils.padLeftWithZeros(num, maxValue.toString().length);
  };
  NumberUtils.ibanLetterToNumber = function(letter) {
    return letter.charCodeAt(0) - 55;
  };
  NumberUtils.ibanStringToNumber = function(iban) {
    var numberIban = '';
    for(var i = 0; i < iban.length; i++) {
      var curChar = iban[i];
      if(isNaN(parseInt(curChar))) {
        numberIban += NumberUtils.ibanLetterToNumber(curChar).toString();
      }
      else {
        numberIban += curChar.toString();
      }
    }
    return numberIban;
  };

  function Generators() {}
  // https://fr.wikipedia.org/wiki/Num%C3%A9ro_de_s%C3%A9curit%C3%A9_sociale_en_France#Signification_des_chiffres_du_NIR
  Generators.numSecu = function(femme) {
    var nss = femme ? '2' : '1';
    [99, 12, 93, 999, 999].forEach(function(maxValue) {
      nss += NumberUtils.getPaddedRandomNumber(maxValue);
    });

    var key = 97 - (nss) % 97;
    return nss + StringUtils.padLeftWithZeros(key, 2);
  };
  Generators.numSecuFemme = function() {
    return Generators.numSecu(true);
  };
  Generators.numSecuHomme = function() {
    return Generators.numSecu();
  };
  // https://fr.wikipedia.org/wiki/Basic_Bank_Account_Number#Composition
  Generators.rib = function () {
    var rib = '';
    var sum = 0;
    [{maxValue: 99999, factor: 89}, {maxValue: 99999, factor: 15}, {maxValue: 99999999999, factor: 3}].forEach(function(computeInfos) {
      var num = NumberUtils.getPaddedRandomNumber(computeInfos.maxValue);
      rib += num;
      sum += computeInfos.factor * num;
    });

    var key = 97 - sum % 97;
    return rib + StringUtils.padLeftWithZeros(key, 2);
  };
  // https://en.wikipedia.org/wiki/International_Bank_Account_Number#Structure
  Generators.iban = function () {
    var countryCode = StringUtils.randomUpperLetters(2);
    var bban = Generators.rib();
    // Number is too large, need to process string
    var sum = NumberUtils.ibanStringToNumber(bban.toString() + countryCode + '00');
    while(sum.length > 9) {
      var rest = parseFloat(sum.substr(0, 9)) % 97;
      sum = rest.toString() + sum.substr(9);
    }
    var key = 98 - sum % 97;
    return countryCode + StringUtils.padLeftWithZeros(key, 2) + bban;
  };
  // https://en.wikipedia.org/wiki/ISO_9362#Structure
  Generators.bic = function() {
    var bankCode = StringUtils.randomUpperLetters(4);
    var countryCode = StringUtils.randomUpperLetters(2);
    var locationCode = Math.random() > 0.5 ? StringUtils.randomUpperLetters(2) : NumberUtils.getPaddedRandomNumber(99);
    var branchCode = Math.random() < 0.3 ? 'XXX' : (Math.random() > 0.5 ? '' : NumberUtils.getPaddedRandomNumber(999));
    return bankCode + countryCode + locationCode + branchCode;
  };
  // https://fr.wikipedia.org/wiki/Syst%C3%A8me_d%27identification_du_r%C3%A9pertoire_des_%C3%A9tablissements#Calcul_et_validit.C3.A9_d.27un_num.C3.A9ro_SIRET
  Generators.siret = function () {
    var sum = 0;
    var siret = '';
    for(var i = 14; i > 1; i--) {
      var num = Math.ceil(Math.random()*9);
      var numToSum = (2 - (i%2)) * num;
      sum += numToSum >= 10 ? numToSum - 9 : numToSum;
      siret += num;
    }

    var key = sum % 10 !== 0 ? 10 - sum % 10 : 0;
    return siret + key;
  };

  angular.module('generatorsApp', []).controller('generatorsCtrl', function() {
    var _this = this;

    this.regenerate = function(type) {
      _this[type] = Generators[type]();
    };

    this.valueLabels = {
      rib: 'RIB',
      iban: 'IBAN',
      bic: 'BIC',
      siret: 'SIRET'
    };

    ['numSecuFemme', 'numSecuHomme'].concat(Object.keys(this.valueLabels)).forEach(function(type) {
      _this.regenerate(type);
    });
  });
}());