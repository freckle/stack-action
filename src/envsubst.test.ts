import { envsubst } from "./envsubst";

const HOME = process.env.HOME;

describe("envsubst", () => {
  test("known variables are replaced", () => {
    expect(envsubst("Home is $HOME.")).toEqual(`Home is ${HOME}.`);
  });

  test("known variables with braces are replaced", () => {
    expect(envsubst("Home is ${HOME}.")).toEqual(`Home is ${HOME}.`);
  });

  test("unknown variables are replaced by whitespace", () => {
    expect(envsubst("Home is $XNOPE.")).toEqual("Home is .");
  });

  test("unknown variables with braces are replaced by whitespace", () => {
    expect(envsubst("Home is ${XNOPE}.")).toEqual("Home is .");
  });

  test("invalid braces are not replaced", () => {
    expect(envsubst("Home is ${ HOME}.")).toEqual("Home is ${ HOME}.");
    expect(envsubst("Home is ${HOME }.")).toEqual("Home is ${HOME }.");
  });

  test("mismatched left brace is not replaced", () => {
    expect(envsubst("Home is ${HOME.")).toEqual("Home is ${HOME.");
  });

  test("mismatched right brace is replaced before the brace", () => {
    expect(envsubst("Home is $HOME}.")).toEqual(`Home is ${HOME}}.`);
  });
});
