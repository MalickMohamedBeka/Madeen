import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HabitCard from '../HabitCard';
import { Habit } from '@/types';

// Mock sounds
jest.mock('@/utils/sounds', () => ({
  playSuccessFeedback: jest.fn().mockResolvedValue(undefined),
  playClickFeedback: jest.fn().mockResolvedValue(undefined),
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  Sparkles: 'Sparkles',
  Trash2: 'Trash2',
  BookOpen: 'BookOpen',
}));

describe('HabitCard', () => {
  const mockHabit: Habit = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Prière du Fajr',
    icon: 'BookOpen',
    category: 'prayer',
    completed: false,
    isCustom: false,
  };

  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render habit card correctly', () => {
    const { getByText, getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    expect(getByText('Prière du Fajr')).toBeTruthy();
    expect(getByTestId(`habit-card-${mockHabit.id}`)).toBeTruthy();
  });

  it('should call onToggle when pressed', () => {
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    fireEvent.press(getByTestId(`habit-card-${mockHabit.id}`));

    expect(mockOnToggle).toHaveBeenCalledWith(mockHabit.id);
  });

  it('should show completed state', () => {
    const completedHabit = { ...mockHabit, completed: true };
    const { getByText } = render(
      <HabitCard habit={completedHabit} onToggle={mockOnToggle} />
    );

    const title = getByText('Prière du Fajr');
    expect(title.props.style).toContainEqual(
      expect.objectContaining({ textDecorationLine: 'line-through' })
    );
  });

  it('should show custom badge for custom habits', () => {
    const customHabit = { ...mockHabit, isCustom: true };
    const { getByText } = render(
      <HabitCard habit={customHabit} onToggle={mockOnToggle} />
    );

    expect(getByText('Personnalisé')).toBeTruthy();
  });

  it('should show delete button for custom habits when onDelete provided', () => {
    const customHabit = { ...mockHabit, isCustom: true };
    const { getByTestId } = render(
      <HabitCard habit={customHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(getByTestId(`habit-delete-${mockHabit.id}`)).toBeTruthy();
  });

  it('should not show delete button for non-custom habits', () => {
    const { queryByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    expect(queryByTestId(`habit-delete-${mockHabit.id}`)).toBeNull();
  });

  it('should call onDelete when delete button pressed', () => {
    const customHabit = { ...mockHabit, isCustom: true };
    const { getByTestId } = render(
      <HabitCard habit={customHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} />
    );

    fireEvent.press(getByTestId(`habit-delete-${mockHabit.id}`));

    expect(mockOnDelete).toHaveBeenCalledWith(mockHabit.id);
    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('should play success sound when completing habit', async () => {
    const { playSuccessFeedback } = require('@/utils/sounds');
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    fireEvent.press(getByTestId(`habit-card-${mockHabit.id}`));

    // Wait for async sound to be called
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(playSuccessFeedback).toHaveBeenCalled();
  });

  it('should play click sound when uncompleting habit', async () => {
    const { playClickFeedback } = require('@/utils/sounds');
    const completedHabit = { ...mockHabit, completed: true };
    const { getByTestId } = render(
      <HabitCard habit={completedHabit} onToggle={mockOnToggle} />
    );

    fireEvent.press(getByTestId(`habit-card-${mockHabit.id}`));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(playClickFeedback).toHaveBeenCalled();
  });
});
