export interface BMIData {
  value: number;
  category: string;
  isIdeal: boolean;
  color: string;
}

export function calculateBMI(weight: number, heightCm: number): BMIData {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let category = '';
  let isIdeal = false;
  let color = '#ccc';

  if (roundedBmi < 18.5) {
    category = 'Abaixo do peso';
    color = '#FFD700';
  } else if (roundedBmi >= 18.5 && roundedBmi <= 24.9) {
    category = 'Peso ideal';
    isIdeal = true;
    color = '#4CAF50';
  } else if (roundedBmi >= 25 && roundedBmi <= 29.9) {
    category = 'Sobrepeso';
    color = '#FF9800';
  } else {
    category = 'Obesidade';
    color = '#F44336';
  }

  return {
    value: roundedBmi,
    category,
    isIdeal,
    color,
  };
}
