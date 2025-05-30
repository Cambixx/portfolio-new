import sunnyAnimation from '/src/assets/animations/sunny.json';
import cloudyAnimation from '/src/assets/animations/cloudy.json';
import rainAnimation from '/src/assets/animations/rain.json';

declare module '*.json' {
  const value: any;
  export default value;
}