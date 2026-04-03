declare module "*.geojson" {
  const value: {
    type: string;
    [key: string]: unknown;
  };

  export default value;
}
