import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Github, Linkedin } from "lucide-react"

const developers = [
  {
    name: "Biswajit Rout",
    role: "Lead Developer",
    title: "Full Stack Developer",
    isLead: true,
    image: "/biswajit.png",
    github: "#",
    linkedin: "#",
  },
  {
    name: "Ashish Kumar Singh",
    role: "Full Stack Developer",
    title: "Full Stack Developer",
    isLead: false,
    image: "/placeholder.svg?height=150&width=150",
    github: "#",
    linkedin: "#",
  },
  {
    name: "Aditya Raj",
    role: "Frontend Developer",
    title: "Frontend Developer",
    isLead: false,
    image: "/placeholder.svg?height=150&width=150",
    github: "#",
    linkedin: "#",
  },
]

const Developers = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 mx-auto max-w-7xl">
        <h2 className="mb-12 text-3xl font-bold text-center">Development Team</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {developers.map((dev, index) => (
            <Card
              key={index}
              className={dev.isLead ? "border-2 border-primary" : ""}
            >
              <CardHeader>
                {dev.isLead && (
                  <div className="px-2 py-1 text-xs font-medium text-white rounded-full w-fit bg-primary">
                    {dev.role}
                  </div>
                )}
                <CardTitle className={dev.isLead ? "mt-2" : ""}>{dev.name}</CardTitle>
                <CardDescription>{dev.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="object-cover w-32 h-32 mx-auto rounded-full"
                />
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href={dev.github} target="_blank" rel="noopener noreferrer"><Github/></a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin/></a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Developers
