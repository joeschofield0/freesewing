let expect = require("chai").expect;
let freesewing = require("./dist/index.js");

it("Pattern constructor should initialize object", () => {
  let pattern = new freesewing.Pattern({
    foo: "bar",
    options: {
      constant: 2,
      percentage: { pct: 30, min: 0, max: 100 }
    }
  });
  expect(pattern.width).to.equal(false);
  expect(pattern.height).to.equal(false);
  expect(pattern.settings.complete).to.equal(true);
  expect(pattern.parts).to.eql({});
  expect(pattern.settings.units).to.equal("metric");
  expect(pattern.config.foo).to.equal("bar");
  expect(pattern.settings.options.constant).to.equal(2);
  expect(pattern.settings.options.percentage).to.equal(0.3);
});

it("Should load percentage options", () => {
  let pattern = new freesewing.Pattern({
    options: {
      test: { pct: 30 }
    }
  });
  expect(pattern.settings.options.test).to.equal(0.3);
});

it("Should load millimeter options", () => {
  let pattern = new freesewing.Pattern({
    options: {
      test: { mm: 30 }
    }
  });
  expect(pattern.settings.options.test).to.equal(30);
});

it("Should load degree options", () => {
  let pattern = new freesewing.Pattern({
    options: {
      test: { deg: 15 }
    }
  });
  expect(pattern.settings.options.test).to.equal(15);
});

it("Should load an array option", () => {
  let pattern = new freesewing.Pattern({
    options: {
      test: { dflt: "foo" }
    }
  });
  expect(pattern.settings.options.test).to.equal("foo");
});

it("Should load a count option", () => {
  let pattern = new freesewing.Pattern({
    options: {
      test: { count: 3 }
    }
  });
  expect(pattern.settings.options.test).to.equal(3);
});

it("Should throw an error for an unknown option", () => {
  expect(
    () =>
      new freesewing.Pattern({
        options: {
          test: { foo: "bar" }
        }
      })
  ).to.throw();
});

it("Should merge settings with default settings", () => {
  let pattern = new freesewing.Pattern();
  let settings = {
    foo: "bar",
    deep: {
      free: "ze"
    }
  };
  pattern.mergeSettings(settings);
  expect(pattern.settings.foo).to.equal("bar");
  expect(pattern.settings.locale).to.equal("en");
  expect(pattern.settings.margin).to.equal(2);
  expect(pattern.settings.idPrefix).to.equal("fs-");
  expect(pattern.settings.deep.free).to.equal("ze");
});

it("Should draft according to settings", () => {
  let config = {
    name: "test",
    dependencies: { back: "front" },
    inject: { back: "front" },
    hide: ["back"]
  };
  const Test = function(settings = false) {
    freesewing.Pattern.call(this, config);
    return this;
  };
  Test.prototype = Object.create(freesewing.Pattern.prototype);
  Test.prototype.constructor = Test;
  Test.prototype.draftBack = function(part) {
    this.count++;
    return part;
  };
  Test.prototype.draftFront = function(part) {
    this.count++;
    return part;
  };

  let pattern = new Test();
  pattern.count = 0;
  pattern.draft();
  expect(pattern.count).to.equal(2);
});

it("Should throw an error if per-part draft method is missing", () => {
  let config = {
    name: "test",
    dependencies: { back: "front" },
    inject: { back: "front" },
    hide: ["back"]
  };
  const Test = function(settings = false) {
    freesewing.Pattern.call(this, config);
    return this;
  };
  Test.prototype = Object.create(freesewing.Pattern.prototype);
  Test.prototype.constructor = Test;
  Test.prototype.draftBack = function(part) {
    return part;
  };
  let pattern = new Test();
  expect(() => pattern.draft()).to.throw();
});

it("Should sample an option", () => {
  let pattern = new freesewing.Pattern({
    options: {
      len: { pct: 30, min: 0, max: 100 },
      bonus: 10
    }
  });
  pattern.draft = function() {
    pattern.parts.a = pattern.createPart();
    pattern.parts.b = pattern.createPart();
    let a = pattern.parts.a;
    a.points.from = new a.Point(0, 0);
    a.points.to = new a.Point(
      100 * a.context.settings.options.len,
      a.context.settings.options.bonus
    );
    a.paths.test = new a.Path().move(a.points.from).line(a.points.to);
    pattern.parts.b.inject(a);
  };
  pattern.settings.sample = {
    type: "option",
    option: "len"
  };
  pattern.sample();
  expect(pattern.parts.a.paths.test_1.render).to.equal(true);
  expect(pattern.parts.b.paths.test_10.ops[1].to.y).to.equal(10);
});

it("Should sample a measurement", () => {
  let pattern = new freesewing.Pattern();
  pattern.settings.measurements = { headToToe: 1980 };
  pattern.draft = function() {
    pattern.parts.a = pattern.createPart();
    pattern.parts.b = pattern.createPart();
    let a = pattern.parts.a;
    a.points.from = new a.Point(0, 0);
    a.points.to = new a.Point(10, a.context.settings.measurements.headToToe);
    a.paths.test = new a.Path().move(a.points.from).line(a.points.to);
    pattern.parts.b.inject(a);
  };
  pattern.settings.sample = {
    type: "measurement",
    measurement: "headToToe"
  };
  pattern.sample();
  expect(pattern.parts.a.paths.test_1.render).to.equal(true);
  expect(pattern.parts.b.paths.test_10.ops[1].to.x).to.equal(10);
  expect(() => pattern.sampleMeasurement("unknown")).to.throw();
});

/*
it("Should sample models", () => {
  let pattern = new freesewing.Pattern();
  pattern.draft = function() {
    pattern.parts.a = pattern.createPart();
    pattern.parts.b = pattern.createPart();
    let a = pattern.parts.a;
    a.points.from = new a.Point(0, 0);
    a.points.to = new a.Point(10, a.context.settings.measurements.headToToe);
    a.paths.test = new a.Path().move(a.points.from).line(a.points.to);
    pattern.parts.b.inject(a);
  };
  pattern.settings.sample = {
    type: "models",
    models: {
      a: { headToToe: 1980 },
      b: { headToToe: 1700 }
    }
  };
  pattern.sample();
  expect(pattern.parts.a.paths.test_1.render).to.equal(true);
  expect(pattern.parts.b.paths.test_2.ops[1].to.x).to.equal(10);
});
it("Should sample models with focus", () => {
  let pattern = new freesewing.Pattern();
  pattern.settings.sample = {
    type: "models",
    focus: "a",
    models: {
      a: { headToToe: 1980 },
      b: { headToToe: 1700 }
    }
  };
  pattern.draft = function() {
    pattern.parts.a = pattern.createPart();
    pattern.parts.b = pattern.createPart();
    let a = pattern.parts.a;
    console.log('context', a.context.settings);
    a.points.from = new a.Point(0, 0);
    a.points.to = new a.Point(10, a.context.settings.measurements.headToToe);
    a.points.anchor = new a.Point(20, 30);
    a.paths.test = new a.Path().move(a.points.from).line(a.points.to);
    pattern.parts.b.inject(a);
  };
  pattern.sample();
  expect(pattern.parts.a.paths.test_1.render).to.equal(true);
  expect(pattern.parts.b.paths.test_2.ops[1].to.x).to.equal(10);
  expect(pattern.parts.a.paths.test_1.attributes.get("class")).to.equal(
    "sample-focus"
  );
  expect(pattern.parts.b.paths.test_2.attributes.get("style")).to.equal(
    "stroke: hsl(165, 100%, 35%);"
  );
});
*/
it("Should register a hook via on", () => {
  let pattern = new freesewing.Pattern();
  let count = 0;
  pattern._draft = () => {};
  pattern.on("preDraft", function(pattern) {
    count++;
  });
  pattern.draft();
  expect(count).to.equal(1);
});

it("Should register a hook from a plugin", () => {
  let pattern = new freesewing.Pattern();
  let count = 0;
  pattern._draft = () => {};
  let plugin = {
    name: "test",
    version: "0.1-test",
    hooks: {
      preDraft: function(pattern) {
        count++;
      }
    }
  };
  pattern.with(plugin);
  pattern.draft();
  expect(count).to.equal(1);
});

it("Should check whether a part is needed", () => {
  let config = {
    name: "test",
    dependencies: { back: "front", side: "back" },
    inject: { back: "front" },
    hide: ["back"]
  };
  const Test = function(settings = false) {
    freesewing.Pattern.call(this, config);
    return this;
  };
  Test.prototype = Object.create(freesewing.Pattern.prototype);
  Test.prototype.constructor = Test;
  Test.prototype.draftBack = function(part) {
    return part;
  };
  Test.prototype.draftFront = function(part) {
    return part;
  };

  let pattern = new Test();
  pattern.settings.only = "back";
  expect(pattern.needs("back")).to.equal(true);
  expect(pattern.needs("front")).to.equal(true);
  expect(pattern.needs("side")).to.equal(false);
  pattern.settings.only = ["back", "side"];
  expect(pattern.needs("back")).to.equal(true);
  expect(pattern.needs("front")).to.equal(true);
  expect(pattern.needs("side")).to.equal(true);
});

it("Should check whether a part is wanted", () => {
  let config = {
    name: "test",
    dependencies: { back: "front", side: "back" },
    inject: { back: "front" },
    hide: ["back"]
  };
  const Test = function(settings = false) {
    freesewing.Pattern.call(this, config);
    return this;
  };
  Test.prototype = Object.create(freesewing.Pattern.prototype);
  Test.prototype.constructor = Test;
  Test.prototype.draftBack = function(part) {
    return part;
  };
  Test.prototype.draftFront = function(part) {
    return part;
  };

  let pattern = new Test();
  pattern.settings.only = "back";
  expect(pattern.wants("back")).to.equal(true);
  expect(pattern.wants("front")).to.equal(false);
  expect(pattern.wants("side")).to.equal(false);
  pattern.settings.only = ["back", "side"];
  expect(pattern.wants("back")).to.equal(true);
  expect(pattern.wants("front")).to.equal(false);
  expect(pattern.wants("side")).to.equal(true);
});

it("Should check whether created parts get the pattern context", () => {
  let pattern = new freesewing.Pattern();
  let part = pattern.createPart();
  expect(part.context).to.equal(pattern.context);
});
