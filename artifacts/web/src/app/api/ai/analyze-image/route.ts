export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // TODO: Send to OpenAI/Anthropic for image analysis
    // For now, return mock response
    const mockAnalysis = {
      title: "Toyota Camry 2015, Perfect Condition",
      description:
        "Well-maintained Toyota Camry from 2015. Low mileage, all original parts, never been in accident.",
      category: "Transport",
      subcategory: "Cars",
      price: 15000,
      condition: "ishlatilgan",
      attributes: {
        brand: "Toyota",
        model: "Camry",
        year: 2015,
        mileage: 45000,
        fuelType: "Petrol",
        transmission: "Automatic",
        color: "Silver",
      },
      tags: ["toyota", "camry", "2015", "automatic", "good-condition"],
    };

    return Response.json({
      success: true,
      data: mockAnalysis,
    });
  } catch (error) {
    return Response.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
