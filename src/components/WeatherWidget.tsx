import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { format, fromUnixTime } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import Lottie from 'lottie-react';

const WidgetContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 12px 15px;
  border-radius: 20px;
  color: #fff;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.18);
  z-index: 1000;
  min-width: 280px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => props.isOpen ? '1' : '0.9'});
  background: rgba(23, 25, 35, 0.95);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 25px;
  color: #fff;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.18);
  z-index: 1001;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 95%;
    padding: 20px;
    max-height: 90vh;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
  opacity: ${props => props.isOpen ? '1' : '0'};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CurrentWeather = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .main-temp {
    font-size: 3rem;
    font-weight: 600;
  }

  .weather-details {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
`;

const WeatherDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .label {
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .value {
      font-size: 1.1rem;
      font-weight: 500;
    }
  }
`;

const ForecastSection = styled.div`
  .title {
    font-size: 1.2rem;
    margin-bottom: 15px;
    opacity: 0.9;
  }
`;

const ForecastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;

  .forecast-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 15px;
    text-align: center;

    .day {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 10px;
    }

    .icon {
      width: 40px;
      height: 40px;
      margin: 0 auto 10px;
    }

    .temp {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .description {
      font-size: 0.8rem;
      opacity: 0.8;
      margin-top: 5px;
    }
  }
`;

const WeatherInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const WeatherIcon = styled.div`
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const WeatherSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  .temperature {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .description {
    font-size: 0.8rem;
    opacity: 0.9;
    text-transform: capitalize;
  }
`;

const DateAndLocation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 0.8rem;
  opacity: 0.8;
  text-align: right;
  flex-shrink: 0;
`;

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  main: string;
  details?: {
    feels_like: number;
    humidity: number;
    wind_speed: number;
    pressure: number;
  };
}

interface ForecastData {
  date: number;
  temp: number;
  description: string;
  main: string;
  animationData?: any;
}

const WEATHER_ANIMATIONS: { [key: string]: string } = {
  // Soleado
  Clear: 'https://assets5.lottiefiles.com/packages/lf20_xlky4kvh.json',
  // Nublado
  Clouds: 'https://assets5.lottiefiles.com/packages/lf20_trr3kzyu.json',
  // Lluvia
  Rain: 'https://assets5.lottiefiles.com/packages/lf20_bvs3lk61.json',
  // Tormenta
  Thunderstorm: 'https://assets5.lottiefiles.com/private_files/lf30_kj1v7ucc.json',
  // Nieve
  Snow: 'https://assets5.lottiefiles.com/packages/lf20_2gjz7rtf.json',
  // Niebla/Bruma
  Mist: 'https://assets5.lottiefiles.com/packages/lf20_keiuqeqt.json',
  // Valor por defecto
  default: 'https://assets5.lottiefiles.com/packages/lf20_trr3kzyu.json'
};

const WeatherWidget = () => {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date(Date.now()));
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [animationData, setAnimationData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(() => new Date(Date.now()));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchWeatherData = async (latitude: number, longitude: number, apiKey: string) => {
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`
    );

    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`
    );

    return { weather: weatherResponse.data, forecast: forecastResponse.data };
  };

  const loadAnimation = async (weatherMain: string) => {
    try {
      const animationUrl = WEATHER_ANIMATIONS[weatherMain] || WEATHER_ANIMATIONS.default;
      const response = await fetch(animationUrl);
      return await response.json();
    } catch (error) {
      console.error('Error al cargar la animación:', error);
      return null;
    }
  };

  useEffect(() => {
    const getWeatherData = async () => {
      try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

        if (!apiKey || apiKey === 'tu_api_key_aqui') {
          throw new Error('API key no configurada correctamente en el archivo .env');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const { weather, forecast } = await fetchWeatherData(latitude, longitude, apiKey);

        // Cargar la animación del clima actual
        const currentAnimation = await loadAnimation(weather.weather[0].main);
        setAnimationData(currentAnimation);

        setWeather({
          temp: Math.round(weather.main.temp),
          description: weather.weather[0].description,
          city: weather.name,
          main: weather.weather[0].main,
          details: {
            feels_like: Math.round(weather.main.feels_like),
            humidity: weather.main.humidity,
            wind_speed: Math.round(weather.wind.speed * 3.6),
            pressure: weather.main.pressure
          }
        });

        // Procesar y cargar animaciones para el pronóstico
        const processedForecasts = await Promise.all(
          forecast.list
            .filter((item: any) => {
              const itemDate = new Date(item.dt * 1000);
              return itemDate.getHours() === 12 || itemDate.getHours() === 13;
            })
            .slice(0, 5)
            .map(async (item: any) => {
              const animation = await loadAnimation(item.weather[0].main);
              return {
                date: item.dt,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                main: item.weather[0].main,
                animationData: animation
              };
            })
        );

        setForecast(processedForecasts);
      } catch (error) {
        console.error('Error detallado:', error);
      }
    };

    getWeatherData();
    const weatherTimer = setInterval(getWeatherData, 300000);

    return () => clearInterval(weatherTimer);
  }, []);

  const handleWidgetClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <WidgetContainer onClick={handleWidgetClick}>
        <WeatherInfo>
          <WeatherIcon>
            {animationData && (
              <Lottie 
                animationData={animationData}
                loop={true}
              />
            )}
          </WeatherIcon>
          <WeatherSummary>
            <span className="temperature">{weather?.temp}°C</span>
            <span className="description">{weather?.description}</span>
          </WeatherSummary>
        </WeatherInfo>
        <DateAndLocation>
          <span>{format(currentTime, "d MMM", { locale: es })}</span>
          <span>{weather?.city}</span>
        </DateAndLocation>
      </WidgetContainer>

      <Overlay isOpen={isModalOpen} onClick={handleCloseModal} />
      <Modal isOpen={isModalOpen}>
        <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
        {weather && (
          <ModalContent>
            <CurrentWeather>
              <div style={{ width: '80px', height: '80px' }}>
                {animationData && (
                  <Lottie 
                    animationData={animationData}
                    loop={true}
                  />
                )}
              </div>
              <div className="weather-details">
                <span className="main-temp">{weather.temp}°C</span>
                <span style={{ fontSize: '1.2rem', opacity: 0.9 }}>{weather.description}</span>
                <span style={{ fontSize: '1rem', opacity: 0.7 }}>{weather.city}</span>
              </div>
            </CurrentWeather>

            <WeatherDetails>
              <div className="detail-item">
                <span className="label">Sensación térmica</span>
                <span className="value">{weather.details?.feels_like}°C</span>
              </div>
              <div className="detail-item">
                <span className="label">Humedad</span>
                <span className="value">{weather.details?.humidity}%</span>
              </div>
              <div className="detail-item">
                <span className="label">Viento</span>
                <span className="value">{weather.details?.wind_speed} km/h</span>
              </div>
              <div className="detail-item">
                <span className="label">Presión</span>
                <span className="value">{weather.details?.pressure} hPa</span>
              </div>
            </WeatherDetails>

            <ForecastSection>
              <h3 className="title">Pronóstico próximos días</h3>
              <ForecastGrid>
                {forecast.map((day) => (
                  <div key={day.date} className="forecast-item">
                    <div className="day">
                      {format(fromUnixTime(day.date), 'EEEE', { locale: es })}
                    </div>
                    <div className="icon">
                      {day.animationData && (
                        <Lottie 
                          animationData={day.animationData}
                          loop={true}
                        />
                      )}
                    </div>
                    <div className="temp">{day.temp}°C</div>
                    <div className="description">{day.description}</div>
                  </div>
                ))}
              </ForecastGrid>
            </ForecastSection>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};

export default WeatherWidget;